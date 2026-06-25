package main

import (
	"io"
	"strings"
	"sync"
	"syscall/js"

	"lacrima"
)

type jsLineWriter struct {
	mu  sync.Mutex
	buf string
	cb  js.Value
}

func (w *jsLineWriter) Write(p []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	w.buf += string(p)
	for {
		idx := strings.IndexByte(w.buf, '\n')
		if idx < 0 {
			break
		}

		line := strings.TrimRight(w.buf[:idx], "\r")
		w.buf = w.buf[idx+1:]

		if line != "" && w.cb.Truthy() {
			w.cb.Invoke(line)
		}
	}

	return len(p), nil
}

func main() {
	inputReader, inputWriter := io.Pipe()
	outputWriter := &jsLineWriter{cb: js.Global().Get("lacrimaOnLine")}

	js.Global().Set("lacrimaCommand", js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) < 1 {
			return nil
		}

		_, _ = inputWriter.Write([]byte(args[0].String() + "\n"))
		return nil
	}))

	js.Global().Set("lacrimaQuit", js.FuncOf(func(this js.Value, args []js.Value) any {
		_, _ = inputWriter.Write([]byte("quit\n"))
		return nil
	}))

	go lacrima.RunUCIWithIO(inputReader, outputWriter, outputWriter)
	select {}
}
