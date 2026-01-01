import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playSuccessSound } from '@/lib/audio';

interface QRDisplayProps {
    token: string;
    playerName: string;
    isValidated: boolean;
    validUntil?: string;
}

// Particle component for pulverization effect
function Particle({ index }: { index: number }) {
    const angle = (index / 30) * Math.PI * 2;
    const velocity = 100 + Math.random() * 200;
    const x = Math.cos(angle) * velocity;
    const y = Math.sin(angle) * velocity;

    return (
        <motion.div
            className="absolute w-2 h-2 bg-primary rounded-full"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
                x,
                y,
                opacity: 0,
                scale: 0,
            }}
            transition={{
                duration: 0.8 + Math.random() * 0.4,
                ease: 'easeOut',
            }}
        />
    );
}

export function QRDisplay({ token, playerName, isValidated }: QRDisplayProps) {
    const [showParticles, setShowParticles] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isValidated) {
            setShowParticles(true);
            // Play success sound using Web Audio API
            playSuccessSound();

            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    }, [isValidated]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center gap-6 p-6">
            {/* Player info */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">{playerName}</h2>
                <p className="text-muted-foreground">
                    {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {/* QR Container with animations */}
            <div
                ref={containerRef}
                className="relative flex items-center justify-center"
            >
                <AnimatePresence mode="wait">
                    {!isValidated ? (
                        <motion.div
                            key="qr"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{
                                scale: 1.1,
                                opacity: 0,
                                filter: 'blur(20px)',
                            }}
                            transition={{ duration: 0.5 }}
                            className={cn(
                                'relative p-4 rounded-2xl',
                                'bg-gradient-to-br from-card to-card/80',
                                'border border-border/50',
                                'shadow-[0_0_40px_rgba(34,197,94,0.2)]'
                            )}
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent opacity-50" />

                            {/* QR Code */}
                            <div className="relative bg-white p-4 rounded-xl">
                                <QRCodeSVG
                                    value={token}
                                    size={220}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#000000"
                                    bgColor="#ffffff"
                                />
                            </div>

                            {/* Animated border */}
                            <motion.div
                                className="absolute inset-0 rounded-2xl border-2 border-primary/50"
                                animate={{
                                    boxShadow: [
                                        '0 0 20px rgba(34,197,94,0.3)',
                                        '0 0 40px rgba(34,197,94,0.5)',
                                        '0 0 20px rgba(34,197,94,0.3)',
                                    ],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="validated"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className={cn(
                                'flex flex-col items-center justify-center',
                                'w-[280px] h-[280px]',
                                'rounded-2xl',
                                'bg-gradient-to-br from-green-500 to-green-600',
                                'text-white'
                            )}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                            >
                                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <motion.path
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-xl font-bold mt-4"
                            >
                                ¡Asistencia Registrada!
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Particles */}
                {showParticles && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <Particle key={i} index={i} />
                        ))}
                    </div>
                )}
            </div>

            {/* Status */}
            {!isValidated && (
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Muestra este código QR al entrenador
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        Válido solo para hoy
                    </p>
                </div>
            )}
        </div>
    );
}
