import { useEffect, useRef, useState } from "react";

interface BootScreenProps {
  onComplete: () => void;
}

const RAW_BOOT_LINES: string[] = [
  "[    0.000000] Linux version 6.5.0-gov-hardened (root@gov-build-01) (gcc (GNU) 13.2.0, GNU ld 2.41) #1 SMP PREEMPT_DYNAMIC",
  "[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.5.0-gov root=UUID=4e8a-b71c ro quiet splash crashkernel=512M",
  "[    0.000000] KERNEL supported cpus:",
  "[    0.000000]   Intel GenuineIntel",
  "[    0.000000]   AMD AuthenticAMD",
  "[    0.000000] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'",
  "[    0.000000] x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'",
  "[    0.000000] x86/fpu: Supporting XSAVE feature 0x004: 'AVX registers'",
  "[    0.000000] x86/fpu: xstate_offset[2]:  576, xstate_sizes[2]:  256",
  "[    0.000000] BIOS-provided physical RAM map:",
  "[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable",
  "[    0.000000] BIOS-e820: [mem 0x000000000009fc00-0x000000000009ffff] reserved",
  "[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x00000000bffdffff] usable",
  "[    0.000000] BIOS-e820: [mem 0x00000000bffe0000-0x00000000bfffffff] reserved",
  "[    0.000000] NX (Execute Disable) protection: active",
  "[    0.000000] SMBIOS 3.0.0 present.",
  "[    0.000000] DMI: GOV/INTEL S2600WT, BIOS SE5C610.86B.01.01.0028 04/15/2026",
  "[    0.000000] Hypervisor detected: KVM",
  "[    0.000000] kvm-clock: Using msrs 4b564d01 and 4b564d00",
  "[    0.000000] tsc: Detected 2299.998 MHz processor",
  "[    0.000231] e820: update [mem 0x00000000-0x00000fff] usable ==> reserved",
  "[    0.000234] last_pfn = 0xbffe0 max_arch_pfn = 0x400000000",
  "[    0.000412] MTRR map: 4 entries (3 fixed + 1 variable; max 21), built from 8 variable MTRRs",
  "[    0.000812] CPU MTRRs all blank - virtualized system.",
  "[    0.001129] x86/PAT: Configuration [0-7]: WB  WC  UC- UC  WB  WP  UC- WT",
  "[    0.012004] Kernel/User page tables isolation: enabled",
  "[    0.014331] ACPI: Early table checksum verification disabled",
  "[    0.014892] ACPI: RSDP 0x00000000000F5970 000024 (v02 BOCHS )",
  "[    0.015231] ACPI: XSDT 0x00000000BFFE2670 00004C (v01 BOCHS  BXPC     00000001 01000013)",
  "[    0.015998] ACPI: FACP 0x00000000BFFE25B0 0000F4 (v03 BOCHS  BXPC     00000001 BXPC 00000001)",
  "[    0.024009] No NUMA configuration found",
  "[    0.024571] Faking a node at [mem 0x0000000000000000-0x00000000bffdffff]",
  "[    0.025008] NODE_DATA(0) allocated [mem 0xbffd5000-0xbffdffff]",
  "[    0.029442] Zone ranges:",
  "[    0.029445]   DMA      [mem 0x0000000000001000-0x0000000000ffffff]",
  "[    0.029449]   DMA32    [mem 0x0000000001000000-0x00000000bffdffff]",
  "[    0.029451]   Normal   empty",
  "[    0.029453]   Device   empty",
  "[    0.030881] random: crng init done",
  "[    0.034112] percpu: Embedded 56 pages/cpu s192512 r8192 d28672 u524288",
  "[    0.038992] Built 1 zonelists, mobility grouping on.  Total pages: 770040",
  "[    0.041223] Policy zone: DMA32",
  "[    0.041558] mem auto-init: stack:all(zero), heap alloc:on, heap free:on",
  "[    0.043221] Memory: 3015092K/3145332K available (16384K kernel code, 4218K rwdata, 9892K rodata, 4148K init, 5316K bss)",
  "[    0.045009] Kernel/User page tables isolation: enabled",
  "[    0.046771] ftrace: allocating 47891 entries in 188 pages",
  "[    0.078994] rcu: Preemptible hierarchical RCU implementation.",
  "[    0.082311] NR_IRQS: 524544, nr_irqs: 440, preallocated irqs: 16",
  "[    0.085561] Console: colour VGA+ 80x25",
  "[    0.087222] printk: console [tty0] enabled",
  "[    0.090019] ACPI: Core revision 20240321",
  "[    0.094412] APIC: Switch to symmetric I/O mode setup",
  "[    0.097781] x2apic: enabled by BIOS, switching to x2apic ops",
  "[    0.100110] ..TIMER: vector=0x30 apic1=0 pin1=2 apic2=-1 pin2=-1",
  "[    0.103881] clocksource: tsc-early: mask: 0xffffffffffffffff max_cycles: 0x21266b8c39c, max_idle_ns: 440795244 ns",
  "[    0.114420] Calibrating delay loop (skipped), value calculated using timer frequency.. 4599.99 BogoMIPS (lpj=2299996)",
  "[    0.119811] pid_max: default: 32768 minimum: 301",
  "[    0.122110] LSM: initializing lsm=lockdown,capability,landlock,yama,apparmor,bpf",
  "[    0.124221] mempolicy: Enabling automatic NUMA balancing. Configure with numa_balancing= or sysctl",
  "[    0.130081] Mountpoint-cache hash table entries: 16384 (order: 5, 131072 bytes, linear)",
  "[    0.136601] smp: Bringing up secondary CPUs ...",
  "[    0.138921] x86: Booting SMP configuration:",
  "[    0.139771] .... node  #0, CPUs:      #1 #2 #3 #4 #5 #6 #7",
  "[    0.180023] smp: Brought up 1 node, 8 CPUs",
  "[    0.181882] smpboot: Total of 8 processors activated (36799.96 BogoMIPS)",
  "[    0.198002] devtmpfs: initialized",
  "[    0.201001] x86/mm: Memory block size: 128MB",
  "[    0.215008] PCI: Using configuration type 1 for base access",
  "[    0.224019] cryptd: max_cpu_qlen set to 1000",
  "[    0.241771] HugeTLB: 28 KiB vmemmap can be freed for a 2.00 MiB page",
  "[    0.249001] ACPI: Added _OSI(Module Device)",
  "[    0.249882] ACPI: Added _OSI(Processor Device)",
  "[    0.250991] ACPI: Added _OSI(3.0 _SCP Extensions)",
  "[    0.252109] ACPI: 1 ACPI AML tables successfully acquired and loaded",
  "[    0.260021] ACPI: Interpreter enabled",
  "[    0.261118] ACPI: PM: (supports S0 S3 S4 S5)",
  "[    0.263880] ACPI: Using IOAPIC for interrupt routing",
  "[    0.270091] PCI host bridge to bus 0000:00",
  "[    0.271881] pci_bus 0000:00: root bus resource [io  0x0000-0x0cf7 window]",
  "[    0.273884] pci_bus 0000:00: root bus resource [mem 0x000a0000-0x000bffff window]",
  "[    0.290991] pci 0000:00:00.0: [8086:1237] type 00 class 0x060000",
  "[    0.293009] pci 0000:00:01.0: [8086:7000] type 00 class 0x060100",
  "[    0.295110] pci 0000:00:01.1: [8086:7010] type 00 class 0x010180",
  "[    0.297221] pci 0000:00:02.0: [1234:1111] type 00 class 0x030000",
  "[    0.310019] PCI: CLS 0 bytes, default 64",
  "[    0.331009] clocksource: Switched to clocksource kvm-clock",
  "[    0.391881] pnp: PnP ACPI init",
  "[    0.394001] pnp: PnP ACPI: found 6 devices",
  "[    0.412091] NET: Registered PF_INET protocol family",
  "[    0.414001] IP idents hash table entries: 65536 (order: 7, 524288 bytes, linear)",
  "[    0.420881] tcp_listen_portaddr_hash hash table entries: 2048 (order: 3, 32768 bytes, linear)",
  "[    0.422991] Table-perturb hash table entries: 65536 (order: 6, 262144 bytes, linear)",
  "[    0.425002] TCP established hash table entries: 32768 (order: 6, 262144 bytes, linear)",
  "[    0.427331] TCP bind hash table entries: 32768 (order: 7, 524288 bytes, linear)",
  "[    0.435008] NET: Registered PF_UNIX/PF_LOCAL protocol family",
  "[    0.451009] RPC: Registered named UNIX socket transport module.",
  "[    0.471119] PCI: CLS 0 bytes, default 64",
  "[    0.481001] kvm-guest: PV spinlocks enabled",
  "[    0.482991] PCI-DMA: Using software bounce buffering for IO (SWIOTLB)",
  "[    0.490991] software IO TLB: mapped [mem 0x00000000bbfe0000-0x00000000bffe0000] (64MB)",
  "[    0.510091] Initialise system trusted keyrings",
  "[    0.514001] workingset: timestamp_bits=40 max_order=20 bucket_order=0",
  "[    0.530009] zbud: loaded",
  "[    0.541091] NFS: Registering the id_resolver key type",
  "[    0.555009] Key type asymmetric registered",
  "[    0.561019] alg: self-tests for CTR-KDF (hmac(sha256)) passed",
  "[    0.580001] Loaded X.509 cert 'GOV Build kernel signing key: 4d2a1f7c9e3b88a7'",
  "[    0.610091] zswap: loaded using pool zstd/zsmalloc",
  "[    0.629881] Key type encrypted registered",
  "[    0.701002] Freeing unused kernel image (initmem) memory: 4148K",
  "[    0.731991] Write protecting the kernel read-only data: 28672k",
  "[    0.781109] Run /init as init process",
  "[    0.812881]   with arguments:",
  "[    0.812889]     /init",
  "[    0.812891]   with environment:",
  "[    0.812893]     HOME=/",
  "[    0.812895]     TERM=linux",
  "[    1.110009] systemd[1]: systemd 254.5-1.gov running in system mode (+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP)",
  "[    1.118811] systemd[1]: Detected virtualization kvm.",
  "[    1.121009] systemd[1]: Detected architecture x86-64.",
  "[    1.131998] systemd[1]: Hostname set to <gov-node-01>.",
  "[    1.221009] systemd[1]: Queued start job for default target Multi-User System.",
  "[    1.281991] systemd[1]: Created slice Slice /system/getty.",
  "[    1.291002] systemd[1]: Created slice Slice /system/modprobe.",
  "[    1.301188] systemd[1]: Created slice User and Session Slice.",
  "[    1.318001] systemd[1]: Started Forward Password Requests to Wall Directory Watch.",
  "[    1.331991] systemd[1]: Reached target Path Units.",
  "[    1.341009] systemd[1]: Reached target Slice Units.",
  "[    1.371009] systemd[1]: Reached target Swaps.",
  "[    1.391881] systemd[1]: Listening on Process Core Dump Socket.",
  "[    1.401991] systemd[1]: Listening on initctl Compatibility Named Pipe.",
  "[    1.421009] systemd[1]: Listening on Journal Audit Socket.",
  "[    1.430988] systemd[1]: Listening on Journal Socket (/dev/log).",
  "[    1.451009] systemd[1]: Listening on Journal Socket.",
  "[    1.471009] systemd[1]: Listening on udev Control Socket.",
  "[    1.491119] systemd[1]: Listening on udev Kernel Socket.",
  "[    1.521091] systemd[1]: Mounting Huge Pages File System...",
  "[    1.541009] systemd[1]: Mounting POSIX Message Queue File System...",
  "[    1.561009] systemd[1]: Mounting Kernel Debug File System...",
  "[    1.591019] systemd[1]: Mounting Kernel Trace File System...",
  "[    1.611002] systemd[1]: Starting Create List of Static Device Nodes...",
  "[    1.640991] systemd[1]: Starting Load Kernel Module configfs...",
  "[    1.670881] systemd[1]: Starting Load Kernel Module drm...",
  "[    1.700991] systemd[1]: Starting Load Kernel Module fuse...",
  "[    1.730981] systemd[1]: Starting Journal Service...",
  "[    1.781009] systemd[1]: Starting Apply Kernel Variables...",
  "[    1.821009] systemd[1]: Starting Create Static Device Nodes in /dev...",
  "[    1.870881] systemd[1]: Starting Coldplug All udev Devices...",
  "[    1.921021] systemd[1]: Started Journal Service.",
  "[    1.960009] systemd-journald[221]: Received client request to flush runtime journal.",
  "[    2.011009] EXT4-fs (sda1): mounted filesystem with ordered data mode. Quota mode: none.",
  "[    2.071019] systemd[1]: Mounted Huge Pages File System.",
  "[    2.111009] systemd[1]: Mounted POSIX Message Queue File System.",
  "[    2.151008] systemd[1]: Mounted Kernel Debug File System.",
  "[    2.191002] systemd[1]: Finished Create List of Static Device Nodes.",
  "[    2.231019] systemd[1]: Finished Load Kernel Module configfs.",
  "[    2.281009] systemd[1]: Finished Load Kernel Module drm.",
  "[    2.331009] systemd[1]: Finished Load Kernel Module fuse.",
  "[    2.391019] systemd[1]: Finished Apply Kernel Variables.",
  "[    2.441009] systemd[1]: Finished Create Static Device Nodes in /dev.",
  "[    2.491021] systemd[1]: Mounting FUSE Control File System...",
  "[    2.530881] systemd[1]: Mounting Kernel Configuration File System...",
  "[    2.580991] systemd[1]: Starting udev Kernel Device Manager...",
  "[    2.631021] systemd[1]: Mounted FUSE Control File System.",
  "[    2.681009] systemd[1]: Mounted Kernel Configuration File System.",
  "[    2.731009] systemd[1]: Started udev Kernel Device Manager.",
  "[    2.811009] systemd[1]: Found device /dev/disk/by-uuid/4e8a-b71c.",
  "[    2.871009] systemd[1]: Activating swap /dev/disk/by-uuid/0c91-ff20...",
  "[    2.921009] Adding 8388604k swap on /dev/sda5.  Priority:-2 extents:1 across:8388604k SS",
  "[    2.971009] systemd[1]: Activated swap /dev/disk/by-uuid/0c91-ff20.",
  "[    3.021009] systemd[1]: Reached target Swaps.",
  "[    3.071019] systemd[1]: Finished Coldplug All udev Devices.",
  "[    3.121008] systemd[1]: Starting Load/Save Random Seed...",
  "[    3.171009] systemd[1]: Starting Network Service...",
  "[    3.221009] systemd[1]: Started Load/Save Random Seed.",
  "[    3.281009] systemd[1]: Reached target System Initialization.",
  "[    3.331009] systemd[1]: Started Daily Cleanup of Temporary Directories.",
  "[    3.381019] systemd[1]: Started Discard unused blocks once a week.",
  "[    3.431009] systemd[1]: Reached target Timer Units.",
  "[    3.481008] systemd[1]: Listening on D-Bus System Message Bus Socket.",
  "[    3.531009] systemd[1]: Listening on Open-iSCSI iscsid Socket.",
  "[    3.581019] systemd[1]: Reached target Socket Units.",
  "[    3.631009] systemd[1]: Reached target Basic System.",
  "[    3.681009] systemd[1]: Started D-Bus System Message Bus.",
  "[    3.731008] systemd[1]: Starting OpenSSH server daemon...",
  "[    3.781009] systemd[1]: Starting Permit User Sessions...",
  "[    3.830991] systemd[1]: Starting GOV Cryptography Daemon...",
  "[    3.881009] systemd[1]: Starting GOV IP Intelligence Service...",
  "[    3.930991] systemd[1]: Starting GOV Webhook Relay...",
  "[    3.981009] systemd[1]: Starting GOV Threat Intel Sync...",
  "[    4.031009] systemd[1]: Started GOV Cryptography Daemon.",
  "[    4.081019] systemd[1]: Started GOV IP Intelligence Service.",
  "[    4.131009] systemd[1]: Started GOV Webhook Relay.",
  "[    4.181009] systemd[1]: Started GOV Threat Intel Sync.",
  "[    4.231009] systemd[1]: Started OpenSSH server daemon.",
  "[    4.281019] systemd[1]: Finished Permit User Sessions.",
  "[    4.331009] systemd[1]: Started Getty on tty1.",
  "[    4.381008] systemd[1]: Reached target Login Prompts.",
  "[    4.431019] systemd[1]: Reached target Multi-User System.",
  "[    4.481009] systemd[1]: Startup finished in 1.122s (kernel) + 3.359s (userspace) = 4.481s.",
  "",
  "gov-node-01 login: root",
  "Password: ********",
  "Last login: Sat Apr 25 21:17:02 UTC 2026 on tty1",
  "Welcome to .GOV V8 // Secure Intelligence Platform",
  "",
  ">>> mounting /proc/.gov/intel ...... ok",
  ">>> verifying access manifest ....... ok",
  ">>> establishing TLS tunnel ......... ok",
  ">>> dashboard kernel module loaded .. ok",
  "",
  "Boot Complete",
];

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [doneFlash, setDoneFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let i = 0;

    const tick = () => {
      if (cancelled) return;
      if (i >= RAW_BOOT_LINES.length) {
        setDoneFlash(true);
        setTimeout(() => onComplete(), 700);
        return;
      }
      // Burst lines for that authentic dmesg-flood feel
      const burst = Math.floor(Math.random() * 3) + 2; // 2-4 lines per tick
      i = Math.min(RAW_BOOT_LINES.length, i + burst);
      setVisibleCount(i);
      const delay = 18 + Math.random() * 35; // 18-53ms
      setTimeout(tick, delay);
    };
    tick();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  });

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-black"
      style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
    >
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden p-3"
        style={{
          color: "#dcdcdc",
          fontSize: "12px",
          lineHeight: 1.25,
          whiteSpace: "pre",
          letterSpacing: 0,
        }}
      >
        {RAW_BOOT_LINES.slice(0, visibleCount).map((line, idx) => (
          <div key={idx}>{line || "\u00a0"}</div>
        ))}
        {!doneFlash && (
          <span style={{ background: "#dcdcdc", color: "#000" }}>&nbsp;</span>
        )}
      </div>
    </div>
  );
}
