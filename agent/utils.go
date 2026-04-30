package main

import (
	"bytes"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

var Logger *log.Logger

func InitLogger() {
	// Create log file or append
	file, err := os.OpenFile("hostguard-agent.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		// Fallback to stdout if file can't be opened
		Logger = log.New(os.Stdout, "AGENT: ", log.Ldate|log.Ltime|log.Lshortfile)
		Logger.Println("Failed to open log file, using stdout")
		return
	}
	
	// Write to both file and stdout
	multiWriter := io.MultiWriter(os.Stdout, file)
	Logger = log.New(multiWriter, "AGENT: ", log.Ldate|log.Ltime)
}

// IsLinux checks if the current OS is Linux
func IsLinux() bool {
	return runtime.GOOS == "linux"
}

// RunCommand executes a shell command and returns the output
func RunCommand(name string, arg ...string) (string, error) {
	cmd := exec.Command(name, arg...)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return strings.TrimSpace(stderr.String()), err
	}
	return strings.TrimSpace(out.String()), nil
}

// CommandExists checks if a command is available on the system
func CommandExists(cmd string) bool {
	_, err := exec.LookPath(cmd)
	return err == nil
}
