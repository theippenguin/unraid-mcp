export interface UnraidConfig {
  host: string;
  port: number;
  apiKey: string;
  useTls: boolean;
}

export interface McpServerConfig {
  unraid: UnraidConfig;
  serverPort: number;
  logLevel: "debug" | "info" | "warn" | "error";
}

// Docker types
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped" | "paused" | "restarting" | "dead";
  state: string;
  ports: PortMapping[];
  autostart: boolean;
  cpuPercent?: number;
  memUsage?: number;
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: "tcp" | "udp";
}

// VM types
export interface VirtualMachine {
  id: string;
  name: string;
  status: "running" | "stopped" | "paused" | "crashed";
  cpus: number;
  memoryMb: number;
  os: string;
}

// Array types
export interface ArrayStatus {
  state: "started" | "stopped" | "stopping" | "starting" | "resyncing";
  capacity: StorageCapacity;
  disks: ArrayDisk[];
  parity: ParityDisk[];
}

export interface StorageCapacity {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
}

export interface ArrayDisk {
  id: string;
  name: string;
  device: string;
  status: "disk_ok" | "disk_dsbl" | "disk_np" | "disk_invalid";
  sizeMb: number;
  fsTotalMb: number;
  fsUsedMb: number;
  fsFreeMb: number;
  temp?: number;
}

export interface ParityDisk {
  id: string;
  name: string;
  device: string;
  status: string;
  sizeMb: number;
}

// Share types
export interface Share {
  name: string;
  comment: string;
  allocator: string;
  floor: string;
  splitLevel: string;
  include: string;
  exclude: string;
  useCache: "yes" | "no" | "only" | "prefer";
  exportEnabled: boolean;
  security: "public" | "secure" | "private";
}

// User types
export interface UnraidUser {
  name: string;
  description: string;
  passwordSet: boolean;
}

// System types
export interface SystemInfo {
  hostname: string;
  version: string;
  uptime: number;
  cpu: CpuInfo;
  memory: MemoryInfo;
  motherboard?: string;
}

export interface CpuInfo {
  model: string;
  cores: number;
  threads: number;
  usagePercent: number;
  temp?: number;
}

export interface MemoryInfo {
  totalMb: number;
  usedMb: number;
  freeMb: number;
}

// Plugin types
export interface Plugin {
  name: string;
  version: string;
  author: string;
  description: string;
  installed: boolean;
  updateAvailable: boolean;
}

// Network types
export interface NetworkInterface {
  name: string;
  ipv4?: string;
  ipv6?: string;
  mac: string;
  speed?: string;
  status: "up" | "down";
  rxBytes: number;
  txBytes: number;
}
