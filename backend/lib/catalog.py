"""Static tweak catalog — the single source of truth served by GET /api/tweaks/catalog."""

from typing import Dict, List

from models.tweaks import CatalogOut, CategoryOut, GamePresetOut, TweakOut

CATEGORIES: List[dict] = [
    {
        "id": "hardware",
        "name": "Hardware & Processador",
        "description": "Desbloqueio de núcleos de CPU, agendamento de GPU e ajustes de TRIM SSD",
    },
    {
        "id": "windows",
        "name": "Windows & Debloat",
        "description": "Desativação de telemetria inútil, serviços de segundo plano e planos de energia extrema",
    },
    {
        "id": "rede",
        "name": "Rede & Ping Baixo",
        "description": "Otimização do algoritmo TCP Nagle, desativação de limitação de rede e buffer DNS",
    },
    {
        "id": "input_lag",
        "name": "Input Lag & Periféricos",
        "description": "Ajuste de taxa de sondagem (Polling Rate), timer resolution 0.5ms e aceleração de mouse",
    },
    {
        "id": "jogos",
        "name": "Modo RIP & Presets",
        "description": "Otimizações dedicadas por jogo e isolamento de processos competitivos",
    },
]

TWEAKS: List[dict] = [
    # --- Hardware & Processador (12) ---
    {"key": "core-parking-unpark", "name": "Desestacionar núcleos da CPU", "description": "Impede o Windows de estacionar núcleos e mantém a CPU 100% pronta para o jogo.", "category": "hardware", "impact": "alto", "premium": False, "fps_gain": 8, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "cpu-priority-gaming", "name": "Prioridade de CPU para jogos", "description": "Eleva a prioridade de agendamento do processo em foco acima dos apps de fundo.", "category": "hardware", "impact": "alto", "premium": False, "fps_gain": 6, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "win32-priority-separation", "name": "Separação de prioridade Win32 (26)", "description": "Ajusta o quantum de agendamento para favorecer o jogo em primeiro plano.", "category": "hardware", "impact": "medio", "premium": True, "fps_gain": 3, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "gpu-scheduling-hags", "name": "Agendamento de GPU acelerado (HAGS)", "description": "Ativa o agendamento por hardware para reduzir a fila de renderização da GPU.", "category": "hardware", "impact": "alto", "premium": False, "fps_gain": 5, "ping_reduction": 0, "input_lag_reduction": 0.4},
    {"key": "nvidia-low-latency", "name": "Modo de baixa latência NVIDIA", "description": "Reduz a fila de quadros do driver NVIDIA para resposta mais imediata.", "category": "hardware", "impact": "alto", "premium": False, "fps_gain": 4, "ping_reduction": 0, "input_lag_reduction": 1.2},
    {"key": "amd-antilag", "name": "AMD Anti-Lag / Radeon Boost", "description": "Encurta o pipeline da CPU para GPU em placas Radeon.", "category": "hardware", "impact": "medio", "premium": True, "fps_gain": 4, "ping_reduction": 0, "input_lag_reduction": 0.9},
    {"key": "ram-standby-clean", "name": "Limpeza da lista em standby da RAM", "description": "Libera memória retida por caches para o jogo usar na hora.", "category": "hardware", "impact": "medio", "premium": False, "fps_gain": 3, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "large-system-cache-off", "name": "Large System Cache desativado", "description": "Evita que o sistema segure RAM demais para cache de arquivos.", "category": "hardware", "impact": "baixo", "premium": True, "fps_gain": 1, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "ssd-trim-schedule", "name": "TRIM agendado do SSD", "description": "Mantém o SSD com escrita consistente e carregamentos rápidos.", "category": "hardware", "impact": "medio", "premium": False, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "storage-write-cache", "name": "Cache de gravação avançado", "description": "Ativa o cache de escrita do controlador de armazenamento.", "category": "hardware", "impact": "medio", "premium": True, "fps_gain": 2, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "fan-curve-performance", "name": "Curva de ventoinha desempenho", "description": "Ventoinhas mais agressivas para manter o boost sem thermal throttle.", "category": "hardware", "impact": "baixo", "premium": True, "fps_gain": 2, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "bios-xmp-profile", "name": "Perfil XMP/EXPO da memória", "description": "Roda a RAM na velocidade de fábrica declarada, direto do app.", "category": "hardware", "impact": "alto", "premium": True, "fps_gain": 7, "ping_reduction": 0, "input_lag_reduction": 0},
    # --- Windows & Debloat (15) ---
    {"key": "telemetry-disable", "name": "Telemetria do Windows off", "description": "Desativa a coleta de dados diagnósticos que roda durante o jogo.", "category": "windows", "impact": "alto", "premium": False, "fps_gain": 4, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "bloatware-removal", "name": "Remoção de bloatware", "description": "Remove apps pré-instalados da Microsoft que ninguém pediu.", "category": "windows", "impact": "alto", "premium": False, "fps_gain": 5, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "background-apps-off", "name": "Apps em segundo plano off", "description": "Impede apps UWP de consumir CPU e rede enquanto você joga.", "category": "windows", "impact": "alto", "premium": False, "fps_gain": 6, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "visual-effects-performance", "name": "Efeitos visuais no desempenho", "description": "Troca animações e transparências por velocidade bruta.", "category": "windows", "impact": "medio", "premium": False, "fps_gain": 3, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "power-plan-extreme", "name": "Plano de energia Extreme Performance", "description": "Evita que a CPU reduza frequência no meio da partida.", "category": "windows", "impact": "alto", "premium": False, "fps_gain": 5, "ping_reduction": 0, "input_lag_reduction": 0.3},
    {"key": "cpu-idle-states-off", "name": "Estados ociosos (C-States) off", "description": "CPU nunca 'dorme' — acorda instantâneo em cada input.", "category": "windows", "impact": "alto", "premium": True, "fps_gain": 4, "ping_reduction": 0, "input_lag_reduction": 0.8},
    {"key": "startup-clean", "name": "Limpeza de inicialização", "description": "Tira da inicialização tudo que não precisa subir com o Windows.", "category": "windows", "impact": "medio", "premium": False, "fps_gain": 3, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "scheduled-tasks-off", "name": "Tarefas agendadas inúteis off", "description": "Desliga rotinas de manutenção que disparam durante o jogo.", "category": "windows", "impact": "medio", "premium": True, "fps_gain": 2, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "search-index-off", "name": "Indexação de busca off", "description": "Menos I/O de disco em segundo plano.", "category": "windows", "impact": "baixo", "premium": False, "fps_gain": 1, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "defender-exclusions", "name": "Exclusões do Defender para jogos", "description": "Pasta do jogo fora da varredura em tempo real.", "category": "windows", "impact": "medio", "premium": True, "fps_gain": 3, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "updates-deferral", "name": "Adiar atualizações automáticas", "description": "Windows Update nunca reinicia o PC no meio da ranked.", "category": "windows", "impact": "medio", "premium": False, "fps_gain": 1, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "superfetch-off", "name": "Superfetch/SysMain off", "description": "SSD não precisa de prefetch — só perde tempo com ele.", "category": "windows", "impact": "medio", "premium": False, "fps_gain": 2, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "focus-assist-gaming", "name": "Foco assistido automático", "description": "Silencia notificações quando um jogo abre em tela cheia.", "category": "windows", "impact": "baixo", "premium": False, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 0.2},
    {"key": "game-bar-dvr-off", "name": "Game Bar e DVR off", "description": "O gravador em background do Xbox custa quadros — fora.", "category": "windows", "impact": "alto", "premium": False, "fps_gain": 4, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "aero-transparency-off", "name": "Transparências e Aero off", "description": "Composição da área de trabalho mais leve.", "category": "windows", "impact": "baixo", "premium": True, "fps_gain": 1, "ping_reduction": 0, "input_lag_reduction": 0},
    # --- Rede & Ping Baixo (8) ---
    {"key": "tcp-nodelay", "name": "TCP NoDelay (Nagle off)", "description": "Envia cada pacote na hora, sem agrupar e atrasar.", "category": "rede", "impact": "alto", "premium": False, "fps_gain": 0, "ping_reduction": 8, "input_lag_reduction": 0.5},
    {"key": "network-throttling-off", "name": "NetworkThrottlingIndex off", "description": "Remove o limite de 10 pacotes/ms imposto pelo Windows.", "category": "rede", "impact": "alto", "premium": False, "fps_gain": 0, "ping_reduction": 5, "input_lag_reduction": 0},
    {"key": "dns-optimized", "name": "DNS de baixa latência", "description": "Resolve servidores de jogo pelo resolvedor mais rápido.", "category": "rede", "impact": "medio", "premium": False, "fps_gain": 0, "ping_reduction": 6, "input_lag_reduction": 0},
    {"key": "tcp-autotuning", "name": "TCP Autotuning normal", "description": "Janela de recepção estável para conexões competitivas.", "category": "rede", "impact": "medio", "premium": True, "fps_gain": 0, "ping_reduction": 4, "input_lag_reduction": 0},
    {"key": "nic-power-off", "name": "Economia de energia da NIC off", "description": "Placa de rede nunca entra em modo de economia.", "category": "rede", "impact": "medio", "premium": False, "fps_gain": 0, "ping_reduction": 3, "input_lag_reduction": 0},
    {"key": "interrupt-moderation-off", "name": "Interrupt Moderation off", "description": "Pacotes chegam à CPU imediatamente, sem lote.", "category": "rede", "impact": "medio", "premium": True, "fps_gain": 0, "ping_reduction": 3, "input_lag_reduction": 0.3},
    {"key": "qos-reserve-off", "name": "Reserva QoS de 20% liberada", "description": "Windows reserva 20% da banda para nada — devolve ao jogo.", "category": "rede", "impact": "baixo", "premium": False, "fps_gain": 0, "ping_reduction": 2, "input_lag_reduction": 0},
    {"key": "udp-buffer-tuning", "name": "Buffers UDP ampliados", "description": "Mais espaço na fila para tráfego de jogo em rajada.", "category": "rede", "impact": "baixo", "premium": True, "fps_gain": 0, "ping_reduction": 2, "input_lag_reduction": 0},
    # --- Input Lag & Periféricos (9) ---
    {"key": "usb-polling-1000", "name": "Polling rate do mouse 1000Hz", "description": "O mouse reporta a posição a cada 1ms — rastro zero.", "category": "input_lag", "impact": "alto", "premium": False, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 2.1},
    {"key": "timer-resolution-0-5ms", "name": "Resolução do timer 0.5ms", "description": "Timer do sistema no ponto mais fino suportado.", "category": "input_lag", "impact": "alto", "premium": False, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 1.8},
    {"key": "pointer-accel-off", "name": "Aceleração do ponteiro off", "description": "1 pixel de mouse = 1 pixel na tela, sempre.", "category": "input_lag", "impact": "alto", "premium": False, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 1.2},
    {"key": "fullscreen-opt-off", "name": "Otimizações de tela cheia off", "description": "Força o modo exclusivo real, sem camada de composição.", "category": "input_lag", "impact": "medio", "premium": True, "fps_gain": 2, "ping_reduction": 0, "input_lag_reduction": 1.0},
    {"key": "usb-selective-suspend-off", "name": "Suspensão seletiva de USB off", "description": "Mouse e teclado nunca 'dormem' no meio do round.", "category": "input_lag", "impact": "medio", "premium": False, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 0.8},
    {"key": "keyboard-filter-off", "name": "Filtro de teclas do Windows off", "description": "Cada tecla chega ao jogo sem filtragem do SO.", "category": "input_lag", "impact": "baixo", "premium": False, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 0.5},
    {"key": "raw-input-buffer", "name": "Buffer de Raw Input ampliado", "description": "Sem fila de inputs mesmo em rajadas de clique.", "category": "input_lag", "impact": "medio", "premium": True, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 0.9},
    {"key": "prerendered-frames-1", "name": "Fila de pré-renderização mínima", "description": "O quadro sai da GPU no instante em que fica pronto.", "category": "input_lag", "impact": "medio", "premium": True, "fps_gain": 1, "ping_reduction": 0, "input_lag_reduction": 1.4},
    {"key": "cursor-shadow-off", "name": "Sombra e escala de cursor limpa", "description": "Menos trabalho de composição por frame.", "category": "input_lag", "impact": "baixo", "premium": True, "fps_gain": 0, "ping_reduction": 0, "input_lag_reduction": 0.3},
    # --- Modo RIP & Presets (6) ---
    {"key": "rip-mode-core", "name": "RIP Mode — isolamento de processos", "description": "Congela o que não é essencial e entrega o sistema ao jogo.", "category": "jogos", "impact": "alto", "premium": False, "fps_gain": 9, "ping_reduction": 0, "input_lag_reduction": 0.6},
    {"key": "game-mode-on", "name": "Modo de Jogo do Windows forçado", "description": "Prioridade total de agendamento para o jogo em foco.", "category": "jogos", "impact": "medio", "premium": False, "fps_gain": 3, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "competitive-isolation", "name": "Isolamento de processos competitivos", "description": "Só o jogo, o driver de vídeo e o essencial rodando.", "category": "jogos", "impact": "alto", "premium": True, "fps_gain": 5, "ping_reduction": 0, "input_lag_reduction": 0.7},
    {"key": "ram-prealloc", "name": "Pré-alocação de memória", "description": "Reserva RAM contígua antes de o jogo abrir.", "category": "jogos", "impact": "medio", "premium": True, "fps_gain": 4, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "overlay-blocker", "name": "Bloqueio de overlays", "description": "Discord, GeForce e afastados do pipeline do jogo.", "category": "jogos", "impact": "medio", "premium": False, "fps_gain": 2, "ping_reduction": 0, "input_lag_reduction": 0},
    {"key": "shader-cache-warm", "name": "Cache de shaders aquecido", "description": "Zero stutter nas primeiras rodadas do mapa.", "category": "jogos", "impact": "baixo", "premium": True, "fps_gain": 2, "ping_reduction": 0, "input_lag_reduction": 0},
]

GAMES: List[dict] = [
    {"id": "fortnite", "name": "Fortnite", "gain_pct": 115, "baseline_fps": 95, "keys": ["core-parking-unpark", "gpu-scheduling-hags", "background-apps-off", "game-bar-dvr-off", "tcp-nodelay", "usb-polling-1000", "timer-resolution-0-5ms", "rip-mode-core"]},
    {"id": "valorant", "name": "Valorant", "gain_pct": 125, "baseline_fps": 165, "keys": ["cpu-priority-gaming", "pointer-accel-off", "usb-polling-1000", "tcp-nodelay", "telemetry-disable", "timer-resolution-0-5ms", "focus-assist-gaming"]},
    {"id": "cs2", "name": "Counter-Strike 2", "gain_pct": 115, "baseline_fps": 145, "keys": ["core-parking-unpark", "gpu-scheduling-hags", "nvidia-low-latency", "usb-polling-1000", "tcp-nodelay", "prerendered-frames-1"]},
    {"id": "warzone", "name": "Warzone", "gain_pct": 135, "baseline_fps": 90, "keys": ["ram-standby-clean", "gpu-scheduling-hags", "background-apps-off", "tcp-nodelay", "dns-optimized", "shader-cache-warm"]},
    {"id": "roblox", "name": "Roblox", "gain_pct": 155, "baseline_fps": 60, "keys": ["visual-effects-performance", "background-apps-off", "power-plan-extreme", "network-throttling-off", "startup-clean", "game-mode-on"]},
    {"id": "minecraft", "name": "Minecraft", "gain_pct": 125, "baseline_fps": 75, "keys": ["superfetch-off", "startup-clean", "ram-standby-clean", "search-index-off", "game-mode-on", "updates-deferral"]},
]

# RIP Mode: the max-FPS package applied in one click (all free — every user gets the turbo).
RIP_PACKAGE: List[str] = [
    "core-parking-unpark",
    "cpu-priority-gaming",
    "gpu-scheduling-hags",
    "background-apps-off",
    "power-plan-extreme",
    "game-bar-dvr-off",
    "telemetry-disable",
    "tcp-nodelay",
    "network-throttling-off",
    "timer-resolution-0-5ms",
    "usb-polling-1000",
    "rip-mode-core",
]

TWEAK_BY_KEY: Dict[str, dict] = {t["key"]: t for t in TWEAKS}
GAME_BY_ID: Dict[str, dict] = {g["id"]: g for g in GAMES}


def catalog_out() -> CatalogOut:
    return CatalogOut(
        categories=[CategoryOut(**c) for c in CATEGORIES],
        tweaks=[TweakOut(**t) for t in TWEAKS],
        games=[GamePresetOut(**g) for g in GAMES],
    )
