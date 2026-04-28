package main

import (
	"bytes"
	"os/exec"
	"runtime"
	"strings"
)

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
