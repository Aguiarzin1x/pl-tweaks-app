"""Comandos reais do Windows por tweak — preparados para o EXECUTÁVEL futuro.

IMPORTANTE: nada aqui é executado por este backend. É um catálogo declarativo que o app
web serve em `GET /api/tweaks/commands`, para que o cliente nativo (C#/Rust/PowerShell)
leia e aplique no PC do jogador. O app web continua simulando: ligar um tweak só grava
estado no banco.

Cada entrada tem:
    kind            — "registry" | "powershell" | "cmd" | "bcdedit" | "service" | "manual"
    apply           — linhas de comando que APLICAM o tweak
    revert          — linhas que DESFAZEM (mesma ordem/contrato do apply)
    requires_admin  — precisa de elevação (UAC)
    requires_reboot — só vale após reiniciar
    note            — aviso operacional para quem for implementar o executável

Convenções:
    - Preferir `reg add`/`reg delete` e PowerShell nativo, sem dependências externas.
    - `revert` devolve o valor PADRÃO do Windows, não apenas remove a chave, sempre que o
      padrão for conhecido — remover uma chave que o Windows espera encontrar pode piorar.
    - Tweaks de BIOS/driver/hardware não têm API pública: ficam como "manual", com o passo
      a passo que o executável deve mostrar ao usuário.
"""

from typing import Dict, List

COMMANDS: Dict[str, dict] = {
    # ---------------- Hardware & Processador ----------------
    "core-parking-unpark": {
        "kind": "powershell",
        "apply": [
            'powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100',
            'powercfg -setactive SCHEME_CURRENT',
        ],
        "revert": [
            'powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 5',
            'powercfg -setactive SCHEME_CURRENT',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "CPMINCORES=100 mantém todos os núcleos ativos. O padrão varia por plano de energia.",
    },
    "cpu-priority-gaming": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Priority" /t REG_DWORD /d 6 /f',
            'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Scheduling Category" /t REG_SZ /d "High" /f',
        ],
        "revert": [
            'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Priority" /t REG_DWORD /d 2 /f',
            'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Scheduling Category" /t REG_SZ /d "Medium" /f',
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "Afeta a MMCSS (Multimedia Class Scheduler) para a task 'Games'.",
    },
    "win32-priority-separation": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v "Win32PrioritySeparation" /t REG_DWORD /d 26 /f'
        ],
        "revert": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v "Win32PrioritySeparation" /t REG_DWORD /d 2 /f'
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "26 (0x1A) = quantum curto variável com boost no foreground. Padrão do Windows: 2.",
    },
    "gpu-scheduling-hags": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v "HwSchMode" /t REG_DWORD /d 2 /f'
        ],
        "revert": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v "HwSchMode" /t REG_DWORD /d 1 /f'
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "HAGS exige GPU e driver compatíveis (GTX 1000+/RX 5000+). 2=ligado, 1=desligado.",
    },
    "nvidia-low-latency": {
        "kind": "manual",
        "apply": [
            "# Sem API pública: usar NVAPI (NvAPI_DRS_SetSetting) ou nvidia-smi/driver profile",
            "# Chave do driver: OGL_CPL_PREFER_DXPRESENT / 'Low Latency Mode' = Ultra",
        ],
        "revert": ["# Low Latency Mode = Off (padrão do driver)"],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Precisa da NVAPI (biblioteca NVIDIA) no executável; não há comando nativo do Windows.",
    },
    "amd-antilag": {
        "kind": "manual",
        "apply": ["# Usar AMD ADLX/ADL SDK: definir Radeon Anti-Lag = Enabled no perfil global"],
        "revert": ["# Radeon Anti-Lag = Disabled"],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Requer AMD ADLX SDK no executável; sem equivalente em registro.",
    },
    "ram-standby-clean": {
        "kind": "powershell",
        "apply": [
            '$code = @"\nusing System;using System.Runtime.InteropServices;\npublic class M{[DllImport("ntdll.dll")]public static extern int NtSetSystemInformation(int c,IntPtr i,int l);}\n"@; Add-Type -TypeDefinition $code; # chamar com SystemMemoryListInformation (80) + MemoryPurgeStandbyList (4)'
        ],
        "revert": ["# Operação pontual — nada a desfazer, o Windows repovoa a standby list sozinho"],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Ação instantânea (one-shot), não um estado persistente. Usar SeProfileSingleProcessPrivilege.",
    },
    "large-system-cache-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v "LargeSystemCache" /t REG_DWORD /d 0 /f'
        ],
        "revert": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v "LargeSystemCache" /t REG_DWORD /d 1 /f'
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "0 favorece aplicações (padrão em Windows cliente); 1 favorece cache de arquivos.",
    },
    "ssd-trim-schedule": {
        "kind": "cmd",
        "apply": [
            'fsutil behavior set DisableDeleteNotify 0',
            'schtasks /Change /TN "\\Microsoft\\Windows\\Defrag\\ScheduledDefrag" /ENABLE',
        ],
        "revert": ['fsutil behavior set DisableDeleteNotify 1'],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "DisableDeleteNotify 0 = TRIM ativo (padrão). Rodar 'defrag C: /L' força o TRIM na hora.",
    },
    "storage-write-cache": {
        "kind": "powershell",
        "apply": [
            'Get-PhysicalDisk | ForEach-Object { Set-StorageSetting -NewDiskPolicy OnlineAll } # ou via devcon/WMI: Win32_DiskDrive WriteCacheEnabled=$true'
        ],
        "revert": ["# Desmarcar 'Enable write caching on the device' no Gerenciador de Dispositivos"],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Cache de escrita aumenta risco de perda de dados em queda de energia — avisar o usuário.",
    },
    "fan-curve-performance": {
        "kind": "manual",
        "apply": ["# Sem API padrão: depende do fabricante (ASUS/MSI/Gigabyte SDK) ou da BIOS"],
        "revert": ["# Restaurar curva padrão/automática na BIOS ou no app do fabricante"],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Controle de ventoinha é específico do OEM; o executável deve orientar, não forçar.",
    },
    "bios-xmp-profile": {
        "kind": "manual",
        "apply": ["# Só na BIOS/UEFI: habilitar XMP (Intel) ou EXPO/DOCP (AMD) no perfil 1"],
        "revert": ["# Voltar a memória para Auto/JEDEC na BIOS"],
        "requires_admin": False,
        "requires_reboot": True,
        "note": "IMPOSSÍVEL por software — o executável deve exibir um guia passo a passo da BIOS.",
    },

    # ---------------- Windows & Debloat ----------------
    "telemetry-disable": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f',
            'sc config DiagTrack start= disabled',
            'sc stop DiagTrack',
        ],
        "revert": [
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 1 /f',
            'sc config DiagTrack start= auto',
            'sc start DiagTrack',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "DiagTrack = 'Connected User Experiences and Telemetry'.",
    },
    "bloatware-removal": {
        "kind": "powershell",
        "apply": [
            'Get-AppxPackage -Name "Microsoft.XboxApp","Microsoft.ZuneMusic","Microsoft.BingWeather","Microsoft.People","Microsoft.GetHelp" | Remove-AppxPackage'
        ],
        "revert": [
            '# Reinstalar pela Microsoft Store, ou: Get-AppxPackage -AllUsers <Nome> | Foreach {Add-AppxPackage -Register "$($_.InstallLocation)\\AppXManifest.xml" -DisableDevelopmentMode}'
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "NUNCA remover Microsoft.WindowsStore, .VCLibs, .NET ou Microsoft.UI.Xaml — quebra o sistema.",
    },
    "background-apps-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" /v "GlobalUserDisabled" /t REG_DWORD /d 1 /f'
        ],
        "revert": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" /v "GlobalUserDisabled" /t REG_DWORD /d 0 /f'
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "Afeta apenas apps UWP/Store, não programas Win32.",
    },
    "visual-effects-performance": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v "VisualFXSetting" /t REG_DWORD /d 2 /f',
            'reg add "HKCU\\Control Panel\\Desktop" /v "UserPreferencesMask" /t REG_BINARY /d 9012038010000000 /f',
        ],
        "revert": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v "VisualFXSetting" /t REG_DWORD /d 0 /f',
            'reg add "HKCU\\Control Panel\\Desktop" /v "UserPreferencesMask" /t REG_BINARY 9e3e078012000000 /f',
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "VisualFXSetting: 0=auto, 2=melhor desempenho. Exige logoff para aplicar tudo.",
    },
    "power-plan-extreme": {
        "kind": "powershell",
        "apply": [
            'powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61',
            'powercfg -setactive e9a42b02-d5df-448d-aa00-03f14749eb61',
        ],
        "revert": ['powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e'],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "GUID e9a4... = Ultimate Performance (ocultar em notebooks). Revert = Balanced.",
    },
    "cpu-idle-states-off": {
        "kind": "powershell",
        "apply": [
            'powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 1',
            'powercfg -setactive SCHEME_CURRENT',
        ],
        "revert": [
            'powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 0',
            'powercfg -setactive SCHEME_CURRENT',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Aumenta consumo e temperatura de forma significativa — alertar em notebooks.",
    },
    "startup-clean": {
        "kind": "powershell",
        "apply": [
            'Get-CimInstance Win32_StartupCommand | Where-Object { $_.Command -notmatch "SecurityHealth|OneDrive" } | ForEach-Object { reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v $_.Name /f }'
        ],
        "revert": ["# Restaurar a partir do backup .reg exportado antes da limpeza"],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "OBRIGATÓRIO exportar backup (reg export) antes — é destrutivo e não reversível sozinho.",
    },
    "scheduled-tasks-off": {
        "kind": "cmd",
        "apply": [
            'schtasks /Change /TN "\\Microsoft\\Windows\\Application Experience\\Microsoft Compatibility Appraiser" /DISABLE',
            'schtasks /Change /TN "\\Microsoft\\Windows\\Customer Experience Improvement Program\\Consolidator" /DISABLE',
            'schtasks /Change /TN "\\Microsoft\\Windows\\Autochk\\Proxy" /DISABLE',
        ],
        "revert": [
            'schtasks /Change /TN "\\Microsoft\\Windows\\Application Experience\\Microsoft Compatibility Appraiser" /ENABLE',
            'schtasks /Change /TN "\\Microsoft\\Windows\\Customer Experience Improvement Program\\Consolidator" /ENABLE',
            'schtasks /Change /TN "\\Microsoft\\Windows\\Autochk\\Proxy" /ENABLE',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Nomes de tarefa mudam entre builds do Windows — validar existência antes.",
    },
    "search-index-off": {
        "kind": "service",
        "apply": ['sc config WSearch start= disabled', 'sc stop WSearch'],
        "revert": ['sc config WSearch start= delayed-auto', 'sc start WSearch'],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Quebra a busca do Menu Iniciar e do Outlook — avisar o usuário.",
    },
    "defender-exclusions": {
        "kind": "powershell",
        "apply": ['Add-MpPreference -ExclusionPath "<PASTA_DO_JOGO>"'],
        "revert": ['Remove-MpPreference -ExclusionPath "<PASTA_DO_JOGO>"'],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "O executável deve detectar as pastas de jogo (Steam/Epic/Riot) e pedir confirmação.",
    },
    "updates-deferral": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v "NoAutoRebootWithLoggedOnUsers" /t REG_DWORD /d 1 /f',
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate" /v "DeferQualityUpdatesPeriodInDays" /t REG_DWORD /d 7 /f',
        ],
        "revert": [
            'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v "NoAutoRebootWithLoggedOnUsers" /f',
            'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate" /v "DeferQualityUpdatesPeriodInDays" /f',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Adia, não desativa — nunca bloquear updates de segurança indefinidamente.",
    },
    "superfetch-off": {
        "kind": "service",
        "apply": ['sc config SysMain start= disabled', 'sc stop SysMain'],
        "revert": ['sc config SysMain start= auto', 'sc start SysMain'],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Em HDD o SysMain AJUDA — o executável só deve sugerir isso em SSD/NVMe.",
    },
    "focus-assist-gaming": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.notifications.quiethourssettings" /v "Enabled" /t REG_DWORD /d 1 /f'
        ],
        "revert": ["# Configurações > Sistema > Assistente de Foco > Desativado"],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "O caminho do CloudStore é volátil; preferir a API WinRT de Quiet Hours no executável.",
    },
    "game-bar-dvr-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\System\\GameConfigStore" /v "GameDVR_Enabled" /t REG_DWORD /d 0 /f',
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" /v "AllowGameDVR" /t REG_DWORD /d 0 /f',
        ],
        "revert": [
            'reg add "HKCU\\System\\GameConfigStore" /v "GameDVR_Enabled" /t REG_DWORD /d 1 /f',
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" /v "AllowGameDVR" /t REG_DWORD /d 1 /f',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Desliga a gravação em background do Xbox Game Bar (um dos ganhos mais consistentes).",
    },
    "aero-transparency-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" /v "EnableTransparency" /t REG_DWORD /d 0 /f'
        ],
        "revert": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" /v "EnableTransparency" /t REG_DWORD /d 1 /f'
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "Efeito imediato, sem logoff.",
    },

    # ---------------- Rede & Ping ----------------
    "tcp-nodelay": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\<GUID_NIC>" /v "TcpAckFrequency" /t REG_DWORD /d 1 /f',
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\<GUID_NIC>" /v "TCPNoDelay" /t REG_DWORD /d 1 /f',
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\<GUID_NIC>" /v "TcpDelAckTicks" /t REG_DWORD /d 0 /f',
        ],
        "revert": [
            'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\<GUID_NIC>" /v "TcpAckFrequency" /f',
            'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\<GUID_NIC>" /v "TCPNoDelay" /f',
            'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\<GUID_NIC>" /v "TcpDelAckTicks" /f',
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "<GUID_NIC> = adaptador ativo; obter via Get-NetAdapter/Get-NetIPConfiguration e aplicar em cada um.",
    },
    "network-throttling-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v "NetworkThrottlingIndex" /t REG_DWORD /d 0xFFFFFFFF /f'
        ],
        "revert": [
            'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v "NetworkThrottlingIndex" /t REG_DWORD /d 10 /f'
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "0xFFFFFFFF remove o limite de 10 pacotes/ms imposto à MMCSS. Padrão: 10.",
    },
    "dns-optimized": {
        "kind": "powershell",
        "apply": [
            'Set-DnsClientServerAddress -InterfaceAlias "<NIC>" -ServerAddresses ("1.1.1.1","8.8.8.8")',
            'ipconfig /flushdns',
        ],
        "revert": [
            'Set-DnsClientServerAddress -InterfaceAlias "<NIC>" -ResetServerAddresses',
            'ipconfig /flushdns',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Medir latência antes de escolher o resolver; salvar o DNS anterior para o revert exato.",
    },
    "tcp-autotuning": {
        "kind": "cmd",
        "apply": ['netsh int tcp set global autotuninglevel=normal'],
        "revert": ['netsh int tcp set global autotuninglevel=normal'],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "'normal' já é o padrão — o tweak existe para CORRIGIR máquinas com 'disabled'/'restricted'.",
    },
    "nic-power-off": {
        "kind": "powershell",
        "apply": [
            'Disable-NetAdapterPowerManagement -Name "<NIC>"',
            'Set-NetAdapterAdvancedProperty -Name "<NIC>" -DisplayName "Energy Efficient Ethernet" -DisplayValue "Disabled"',
        ],
        "revert": ['Enable-NetAdapterPowerManagement -Name "<NIC>"'],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Nomes de propriedade avançada variam por driver — tratar falha silenciosamente.",
    },
    "interrupt-moderation-off": {
        "kind": "powershell",
        "apply": [
            'Set-NetAdapterAdvancedProperty -Name "<NIC>" -RegistryKeyword "*InterruptModeration" -RegistryValue 0'
        ],
        "revert": [
            'Set-NetAdapterAdvancedProperty -Name "<NIC>" -RegistryKeyword "*InterruptModeration" -RegistryValue 1'
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Reduz latência ao custo de mais uso de CPU; só recomendado em CPU com folga.",
    },
    "qos-reserve-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" /v "NonBestEffortLimit" /t REG_DWORD /d 0 /f'
        ],
        "revert": [
            'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" /v "NonBestEffortLimit" /t REG_DWORD /d 80 /f'
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "Libera os 20% reservados pelo QoS Packet Scheduler. Padrão: 80 (=20%).",
    },
    "udp-buffer-tuning": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v "FastSendDatagramThreshold" /t REG_DWORD /d 1500 /f',
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v "DefaultSendWindow" /t REG_DWORD /d 65536 /f',
        ],
        "revert": [
            'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v "FastSendDatagramThreshold" /f',
            'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v "DefaultSendWindow" /f',
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "A maioria dos jogos competitivos usa UDP — ajuste no driver AFD (Winsock).",
    },

    # ---------------- Input Lag & Periféricos ----------------
    "usb-polling-1000": {
        "kind": "manual",
        "apply": [
            "# Mouses gamer: definir 1000Hz no software do fabricante (Razer/Logitech/SteelSeries)",
            "# Genéricos: patch de registro no driver mouhid/USB (hidusbf) — exige driver de terceiros",
        ],
        "revert": ["# Voltar a taxa para 125Hz/500Hz no software do fabricante"],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "Não há API nativa do Windows para polling rate; o executável deve detectar o mouse e orientar.",
    },
    "timer-resolution-0-5ms": {
        "kind": "powershell",
        "apply": [
            '# API: NtSetTimerResolution(5000, TRUE, &actual) via ntdll.dll — 5000 unidades de 100ns = 0,5ms',
            'bcdedit /set useplatformtick yes',
            'bcdedit /set disabledynamictick yes',
        ],
        "revert": [
            'bcdedit /deletevalue useplatformtick',
            'bcdedit /deletevalue disabledynamictick',
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "A resolução via NtSetTimerResolution precisa de um processo residente; o executável deve mantê-la.",
    },
    "pointer-accel-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Control Panel\\Mouse" /v "MouseSpeed" /t REG_SZ /d "0" /f',
            'reg add "HKCU\\Control Panel\\Mouse" /v "MouseThreshold1" /t REG_SZ /d "0" /f',
            'reg add "HKCU\\Control Panel\\Mouse" /v "MouseThreshold2" /t REG_SZ /d "0" /f',
        ],
        "revert": [
            'reg add "HKCU\\Control Panel\\Mouse" /v "MouseSpeed" /t REG_SZ /d "1" /f',
            'reg add "HKCU\\Control Panel\\Mouse" /v "MouseThreshold1" /t REG_SZ /d "6" /f',
            'reg add "HKCU\\Control Panel\\Mouse" /v "MouseThreshold2" /t REG_SZ /d "10" /f',
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "1 pixel de mouse = 1 pixel na tela. Exige logoff ou SystemParametersInfo para aplicar.",
    },
    "fullscreen-opt-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\System\\GameConfigStore" /v "GameDVR_FSEBehaviorMode" /t REG_DWORD /d 2 /f',
            'reg add "HKCU\\System\\GameConfigStore" /v "GameDVR_DXGIHonorFSEWindowsCompatible" /t REG_DWORD /d 1 /f',
        ],
        "revert": [
            'reg add "HKCU\\System\\GameConfigStore" /v "GameDVR_FSEBehaviorMode" /t REG_DWORD /d 0 /f',
            'reg add "HKCU\\System\\GameConfigStore" /v "GameDVR_DXGIHonorFSEWindowsCompatible" /t REG_DWORD /d 0 /f',
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "Também pode ser feito por executável: flag DISABLEDXMAXIMIZEDWINDOWEDMODE em AppCompatFlags.",
    },
    "usb-selective-suspend-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB" /v "DisableSelectiveSuspend" /t REG_DWORD /d 1 /f',
            'powercfg -setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0',
        ],
        "revert": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB" /v "DisableSelectiveSuspend" /t REG_DWORD /d 0 /f',
            'powercfg -setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 1',
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "O GUID do powercfg é 'USB selective suspend setting'. Evita micro-travadas do periférico.",
    },
    "keyboard-filter-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Control Panel\\Accessibility\\Keyboard Response" /v "Flags" /t REG_SZ /d "122" /f',
            'reg add "HKCU\\Control Panel\\Accessibility\\StickyKeys" /v "Flags" /t REG_SZ /d "506" /f',
        ],
        "revert": [
            'reg add "HKCU\\Control Panel\\Accessibility\\Keyboard Response" /v "Flags" /t REG_SZ /d "126" /f',
            'reg add "HKCU\\Control Panel\\Accessibility\\StickyKeys" /v "Flags" /t REG_SZ /d "510" /f',
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "Desliga FilterKeys/StickyKeys — remove atraso artificial e o popup no meio da partida.",
    },
    "raw-input-buffer": {
        "kind": "manual",
        "apply": ["# Configuração por jogo (ex.: CS2 'm_rawinput 1'); no Windows não há chave global"],
        "revert": ["# Reverter a opção de raw input no jogo"],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "O executável pode editar os arquivos de config dos jogos suportados.",
    },
    "prerendered-frames-1": {
        "kind": "manual",
        "apply": ["# NVIDIA: NVAPI 'Max Frame Rendering Ahead' = 1 | AMD: 'Flip Queue Size' = 1"],
        "revert": ["# Voltar para 'Use the 3D application setting' (padrão)"],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Somente via NVAPI/ADLX; sem comando nativo do Windows.",
    },
    "cursor-shadow-off": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Control Panel\\Desktop" /v "UserPreferencesMask" /t REG_BINARY /d 9012038010000000 /f'
        ],
        "revert": [
            'reg add "HKCU\\Control Panel\\Desktop" /v "UserPreferencesMask" /t REG_BINARY /d 9e3e078012000000 /f'
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "Mesma máscara de 'efeitos visuais' — aplicar os dois juntos para não sobrescrever.",
    },

    # ---------------- Modo RIP & Presets ----------------
    "rip-mode-core": {
        "kind": "powershell",
        "apply": [
            'Get-Process | Where-Object { $_.Name -in @("chrome","msedge","Discord","Spotify","OneDrive","Teams") } | ForEach-Object { $_.PriorityClass = "Idle" }',
            '# Suspender de verdade: NtSuspendProcess (ntdll) nos PIDs não essenciais',
        ],
        "revert": [
            'Get-Process | Where-Object { $_.Name -in @("chrome","msedge","Discord","Spotify","OneDrive","Teams") } | ForEach-Object { $_.PriorityClass = "Normal" }',
            '# NtResumeProcess nos PIDs suspensos',
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "NUNCA suspender processos de sistema (csrss, winlogon, dwm, antivírus) — tela azul garantida.",
    },
    "game-mode-on": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Software\\Microsoft\\GameBar" /v "AllowAutoGameMode" /t REG_DWORD /d 1 /f',
            'reg add "HKCU\\Software\\Microsoft\\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 1 /f',
        ],
        "revert": [
            'reg add "HKCU\\Software\\Microsoft\\GameBar" /v "AllowAutoGameMode" /t REG_DWORD /d 0 /f',
            'reg add "HKCU\\Software\\Microsoft\\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 0 /f',
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "Modo de Jogo do Windows: prioriza o jogo em foco e segura updates/notificações.",
    },
    "competitive-isolation": {
        "kind": "powershell",
        "apply": [
            '$g = Get-Process "<EXE_DO_JOGO>"; $g.PriorityClass = "High"; $g.ProcessorAffinity = 0xFFF0 # reserva os núcleos 0-3 pro sistema'
        ],
        "revert": [
            '$g = Get-Process "<EXE_DO_JOGO>"; $g.PriorityClass = "Normal"; $g.ProcessorAffinity = (1 -shl (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors) - 1'
        ],
        "requires_admin": True,
        "requires_reboot": False,
        "note": "Afinidade precisa respeitar P-cores/E-cores em Intel 12ª geração+; calcular a máscara dinamicamente.",
    },
    "ram-prealloc": {
        "kind": "registry",
        "apply": [
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v "ClearPageFileAtShutdown" /t REG_DWORD /d 0 /f',
            'wmic computersystem set AutomaticManagedPagefile=False',
            'wmic pagefileset where name="C:\\\\pagefile.sys" set InitialSize=16384,MaximumSize=16384',
        ],
        "revert": ['wmic computersystem set AutomaticManagedPagefile=True'],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "Dimensionar o pagefile pela RAM instalada; nunca desativar por completo.",
    },
    "overlay-blocker": {
        "kind": "registry",
        "apply": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v "AppCaptureEnabled" /t REG_DWORD /d 0 /f',
            '# Steam: desmarcar overlay em localconfig.vdf | Discord: openasar/settings.json overlay=false',
        ],
        "revert": [
            'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v "AppCaptureEnabled" /t REG_DWORD /d 1 /f'
        ],
        "requires_admin": False,
        "requires_reboot": False,
        "note": "Overlays injetam DLL no processo do jogo — causa comum de stutter e conflito com anticheat.",
    },
    "shader-cache-warm": {
        "kind": "powershell",
        "apply": [
            '# NVIDIA: aumentar o limite do shader cache via NVAPI (ou DWORD "ShaderCacheSize")',
            'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v "ShaderCacheSizeMB" /t REG_DWORD /d 10240 /f',
        ],
        "revert": [
            'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v "ShaderCacheSizeMB" /f'
        ],
        "requires_admin": True,
        "requires_reboot": True,
        "note": "Cache maior reduz stutter de primeira execução; custa espaço em disco.",
    },
}


def commands_for(key: str) -> dict:
    """Comandos de um tweak, com fallback seguro para chave ainda não mapeada."""
    return COMMANDS.get(
        key,
        {
            "kind": "manual",
            "apply": [],
            "revert": [],
            "requires_admin": False,
            "requires_reboot": False,
            "note": "Comandos ainda não mapeados para este ajuste.",
        },
    )


def missing_keys(all_keys: List[str]) -> List[str]:
    """Chaves do catálogo sem comandos — usado pelo teste de integridade."""
    return [k for k in all_keys if k not in COMMANDS]
