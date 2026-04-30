package main

import (
	"net"
	"os"
	"os/user"
	"runtime"
	"strings"
	"time"
)

type HostInfo struct {
	Hostname      string `json:"hostname"`
	OSName        string `json:"os_name"`
	OSVersion     string `json:"os_version"`
	KernelVersion string `json:"kernel_version"`
	IPAddress     string `json:"ip_address"`
	CurrentUser   string `json:"current_user"`
	Uptime        string `json:"uptime"`
	Timestamp     string `json:"timestamp"`
}

type Package struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

func CollectHostInfo() HostInfo {
	info := HostInfo{
		Timestamp: time.Now().Format(time.RFC3339),
	}

	// Hostname
	hostname, err := os.Hostname()
	if err == nil {
		info.Hostname = hostname
	} else {
		info.Hostname = "Unknown"
	}

	// OS and Kernel
	info.OSName = runtime.GOOS
	info.KernelVersion = runtime.GOARCH // Fallback for architecture if kernel is hard to get cross-platform

	if IsLinux() {
		// Read /etc/os-release
		if data, err := os.ReadFile("/etc/os-release"); err == nil {
			lines := strings.Split(string(data), "\n")
			for _, line := range lines {
				if strings.HasPrefix(line, "NAME=") {
					info.OSName = strings.Trim(strings.TrimPrefix(line, "NAME="), ` "`)
				}
				if strings.HasPrefix(line, "VERSION=") {
					info.OSVersion = strings.Trim(strings.TrimPrefix(line, "VERSION="), ` "`)
				}
			}
		}

		if info.OSName == "" {
			info.OSName = "Linux"
		}

		// Kernel Version via uname -r
		if out, err := RunCommand("uname", "-r"); err == nil {
			info.KernelVersion = out
		}

		// Uptime
		if data, err := os.ReadFile("/proc/uptime"); err == nil {
			fields := strings.Fields(string(data))
			if len(fields) > 0 {
				info.Uptime = fields[0] + " seconds"
			}
		}
	} else {
		info.OSName = runtime.GOOS
		info.OSVersion = runtime.GOARCH
		info.KernelVersion = runtime.Compiler
		info.Uptime = "unknown"
	}

	// IP Address
	info.IPAddress = getLocalIP()

	// Current User
	u, err := user.Current()
	if err == nil {
		info.CurrentUser = u.Username
	} else {
		info.CurrentUser = "Unknown"
	}

	return info
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "127.0.0.1"
	}
	for _, address := range addrs {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "127.0.0.1"
}

func CollectPackages() []Package {
	var packages []Package



	// Detect Distro and Package Manager
	if CommandExists("dpkg") {
		out, err := RunCommand("dpkg-query", "-W", "-f=${Package} ${Version}\n")
		if err == nil {
			lines := strings.Split(out, "\n")
			for _, line := range lines {
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					packages = append(packages, Package{Name: parts[0], Version: parts[1]})
				}
			}
		}
	} else if CommandExists("rpm") {
		out, err := RunCommand("rpm", "-qa", "--queryformat", "%{NAME} %{VERSION}\n")
		if err == nil {
			lines := strings.Split(out, "\n")
			for _, line := range lines {
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					packages = append(packages, Package{Name: parts[0], Version: parts[1]})
				}
			}
		}
	} else if CommandExists("apk") {
		out, err := RunCommand("apk", "info", "-v")
		if err == nil {
			lines := strings.Split(out, "\n")
			for _, line := range lines {
				if line == "" {
					continue
				}
				// apk info -v usually returns pkg-version
				// We can try to split by the last dash or just use the whole string
				packages = append(packages, Package{Name: line, Version: "latest"})
			}
		}
	}



	return packages
}


