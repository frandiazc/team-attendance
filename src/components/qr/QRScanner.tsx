import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { playSuccessSound, playErrorSound } from '@/lib/audio';

interface QRScannerProps {
    onScan: (token: string) => Promise<{ success: boolean; player_name?: string; error?: string }>;
}

export function QRScanner({ onScan }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<{
        success: boolean;
        player_name?: string;
        error?: string;
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startScanner = useCallback(async () => {
        if (!containerRef.current) return;

        setCameraError(null);

        try {
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText) => {
                    if (isProcessing) return;

                    setIsProcessing(true);

                    // Vibrate on detection
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }

                    try {
                        const result = await onScan(decodedText);
                        setLastResult(result);

                        if (result.success) {
                            // Play success sound using Web Audio API
                            playSuccessSound();

                            if (navigator.vibrate) {
                                navigator.vibrate([100, 50, 200]);
                            }
                        } else {
                            // Error sound/vibration
                            playErrorSound();
                            if (navigator.vibrate) {
                                navigator.vibrate([50, 50, 50]);
                            }
                        }
                    } catch (error) {
                        setLastResult({ success: false, error: 'Error al procesar' });
                    }

                    // Reset after 3 seconds
                    setTimeout(() => {
                        setLastResult(null);
                        setIsProcessing(false);
                    }, 3000);
                },
                () => { }
            );

            setIsScanning(true);
        } catch (error: any) {
            console.error('Error starting scanner:', error);
            if (error?.message?.includes('NotAllowedError') || error?.name === 'NotAllowedError') {
                setCameraError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
            } else if (error?.message?.includes('NotFoundError') || error?.name === 'NotFoundError') {
                setCameraError('No se encontró ninguna cámara en este dispositivo.');
            } else if (error?.message?.includes('NotReadableError') || error?.name === 'NotReadableError') {
                setCameraError('La cámara está siendo usada por otra aplicación.');
            } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                setCameraError('Se requiere HTTPS para acceder a la cámara. Usa localhost o configura HTTPS.');
            } else {
                setCameraError(`Error al iniciar la cámara: ${error?.message || 'Error desconocido'}`);
            }
        }
    }, [onScan, isProcessing]);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
        setIsScanning(false);
    }, []);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-6 p-4 w-full max-w-md mx-auto">
            {/* Scanner container */}
            <div
                ref={containerRef}
                className={cn(
                    'relative w-full aspect-square rounded-2xl overflow-hidden',
                    'bg-black/90',
                    'border-2',
                    lastResult?.success ? 'border-green-500' : lastResult?.error ? 'border-red-500' : 'border-primary/50'
                )}
            >
                {/* Camera view */}
                <div id="qr-reader" className="w-full h-full" />

                {/* Overlay when not scanning */}
                {!isScanning && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <p className="text-white/70">Pulsa para escanear</p>
                        </div>
                    </div>
                )}

                {/* Camera error overlay */}
                {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-red-400 font-medium mb-2">Error de cámara</p>
                            <p className="text-white/70 text-sm">{cameraError}</p>
                        </div>
                    </div>
                )}

                {/* Scan frame overlay */}
                {isScanning && !lastResult && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                className="w-64 h-64 border-2 border-primary rounded-xl"
                                animate={{
                                    boxShadow: [
                                        '0 0 0 0 rgba(34,197,94,0.4)',
                                        '0 0 0 10px rgba(34,197,94,0)',
                                    ],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeOut',
                                }}
                            >
                                {/* Corner decorations */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                            </motion.div>
                        </div>

                        {/* Scanning line */}
                        <motion.div
                            className="absolute left-1/2 -translate-x-1/2 w-56 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                            animate={{
                                top: ['30%', '70%', '30%'],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>
                )}

                {/* Result overlay */}
                <AnimatePresence>
                    {lastResult && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                'absolute inset-0 flex flex-col items-center justify-center',
                                lastResult.success ? 'bg-green-500/90' : 'bg-red-500/90'
                            )}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 15 }}
                            >
                                {lastResult.success ? (
                                    <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-white text-xl font-bold mt-4"
                            >
                                {lastResult.success ? lastResult.player_name : lastResult.error}
                            </motion.p>
                            {lastResult.success && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/80 mt-2"
                                >
                                    ¡Asistencia registrada!
                                </motion.p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Control button */}
            <Button
                onClick={isScanning ? stopScanner : startScanner}
                size="lg"
                className={cn(
                    'w-full max-w-xs h-14 text-lg font-semibold',
                    isScanning
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-primary hover:bg-primary/90'
                )}
            >
                {isScanning ? (
                    <>
                        <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Detener Scanner
                    </>
                ) : (
                    <>
                        <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Iniciar Scanner
                    </>
                )}
            </Button>

            {/* Manual code entry - useful for testing without camera/HTTPS */}
            <div className="w-full max-w-xs">
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            id="manual-code"
                            placeholder="Introducir código manualmente"
                            className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    const code = input.value.trim();
                                    if (code && !isProcessing) {
                                        setIsProcessing(true);
                                        try {
                                            const result = await onScan(code);
                                            setLastResult(result);
                                            if (result.success) {
                                                playSuccessSound();
                                                input.value = '';
                                            } else {
                                                playErrorSound();
                                            }
                                        } catch {
                                            setLastResult({ success: false, error: 'Error al procesar' });
                                        }
                                        setTimeout(() => {
                                            setLastResult(null);
                                            setIsProcessing(false);
                                        }, 3000);
                                    }
                                }
                            }}
                        />
                    </div>
                    <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={async () => {
                            const input = document.getElementById('manual-code') as HTMLInputElement;
                            const code = input?.value.trim();
                            if (code && !isProcessing) {
                                setIsProcessing(true);
                                try {
                                    const result = await onScan(code);
                                    setLastResult(result);
                                    if (result.success) {
                                        playSuccessSound();
                                        input.value = '';
                                    } else {
                                        playErrorSound();
                                    }
                                } catch {
                                    setLastResult({ success: false, error: 'Error al procesar' });
                                }
                                setTimeout(() => {
                                    setLastResult(null);
                                    setIsProcessing(false);
                                }, 3000);
                            }
                        }}
                    >
                        Validar
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    Sin cámara: pide al jugador el código de su QR
                </p>
            </div>

            {/* Instructions */}
            <p className="text-sm text-muted-foreground text-center">
                Apunta la cámara al código QR del jugador
            </p>
        </div>
    );
}
