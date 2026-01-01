import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { QRDisplay } from './components/qr/QRDisplay';
import { QRScanner } from './components/qr/QRScanner';
import { AttendanceCalendar } from './components/calendar/AttendanceCalendar';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

import { Avatar, AvatarFallback } from './components/ui/avatar';
import { cn } from './lib/utils';
import './index.css';

const queryClient = new QueryClient();

// Auth Context
interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'player';
    team_id: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(setUser)
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                });
        }
    }, [token]);

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Error al iniciar sesión');
        }
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Error al registrarse');
        }
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Login Page
function LoginPage() {
    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                await register(name, email, password);
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative"
            >
                <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <CardTitle className="text-2xl font-bold">Team Attendance</CardTitle>
                        <CardDescription>
                            {isRegister ? 'Crea tu cuenta de jugador' : 'Inicia sesión en tu cuenta'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence mode="wait">
                                {isRegister && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <Label htmlFor="name">Nombre</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Tu nombre"
                                            required={isRegister}
                                            className="mt-1.5"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="mt-1.5"
                                />
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsRegister(!isRegister)}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Demo credentials hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 text-center text-sm text-muted-foreground"
                >
                    <p>Demo Admin: admin@team.com / admin123</p>
                </motion.div>
            </motion.div>
        </div>
    );
}

// Player Dashboard
function PlayerDashboard() {
    const { user, logout } = useAuth();
    const [isValidated, setIsValidated] = useState(false);

    const { data: qrData, isLoading } = useQuery({
        queryKey: ['daily-qr', user?.id],
        queryFn: async () => {
            const res = await fetch(`/api/qr/daily?user_id=${user?.id}`);
            const data = await res.json();
            setIsValidated(data.is_used === 1);
            return data;
        },
        enabled: !!user?.id,
        refetchInterval: 5000, // Check every 5 seconds if validated
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
                <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-foreground">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">Jugador</p>
                        </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={logout} className="gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Salir
                    </Button>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-lg mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : qrData ? (
                    <QRDisplay
                        token={qrData.qr_token}
                        playerName={user?.name || ''}
                        isValidated={isValidated}
                    />
                ) : (
                    <div className="text-center text-muted-foreground">
                        Error al cargar el código QR
                    </div>
                )}
            </main>
        </div>
    );
}

// Settings Tab Component
function SettingsTab() {
    const { user, token, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name !== user?.name ? name : undefined,
                    email: email !== user?.email ? email : undefined,
                    currentPassword: newPassword ? currentPassword : undefined,
                    newPassword: newPassword || undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al actualizar');
            }

            // Update token in localStorage
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Reload page to refresh user data
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
        setLoading(false);
    };

    return (
        <motion.div
            key="settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
        >
            <h2 className="text-xl font-bold">Ajustes de Perfil</h2>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Editar Perfil</CardTitle>
                    <CardDescription>Cambia tu nombre, email o contraseña</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="settingsName">Nombre</Label>
                            <Input
                                id="settingsName"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="settingsEmail">Email</Label>
                            <Input
                                id="settingsEmail"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-1.5"
                            />
                        </div>

                        <div className="border-t border-border pt-4 mt-4">
                            <p className="text-sm text-muted-foreground mb-3">Cambiar contraseña (opcional)</p>

                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        placeholder="Requerida para cambiar contraseña"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Dejar vacío para no cambiar"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Repetir nueva contraseña"
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        </div>

                        {message && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                    'text-sm p-3 rounded-lg',
                                    message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
                                )}
                            >
                                {message.text}
                            </motion.p>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardContent className="pt-6">
                    <Button variant="destructive" className="w-full" onClick={logout}>
                        Cerrar Sesión
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Admin Dashboard
function AdminDashboard() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('scanner');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);

    // Players query
    const { data: players = [] } = useQuery({
        queryKey: ['players'],
        queryFn: async () => {
            const res = await fetch('/api/players');
            return res.json();
        }
    });

    // Calendar data query
    const { data: calendarData } = useQuery({
        queryKey: ['calendar', calendarYear, calendarMonth],
        queryFn: async () => {
            const res = await fetch(`/api/attendance/calendar?year=${calendarYear}&month=${calendarMonth}`);
            return res.json();
        }
    });

    // Attendance for selected date
    const { data: dateAttendance } = useQuery({
        queryKey: ['attendance', selectedDate],
        queryFn: async () => {
            if (!selectedDate) return null;
            const res = await fetch(`/api/attendance/date/${selectedDate}`);
            return res.json();
        },
        enabled: !!selectedDate
    });

    // Validate mutation
    const validateMutation = useMutation({
        mutationFn: async (token: string) => {
            const res = await fetch('/api/attendance/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qr_token: token, validated_by: user?.id })
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        }
    });

    // Add player mutation
    const addPlayerMutation = useMutation({
        mutationFn: async (data: { name: string; email: string }) => {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['players'] });
        }
    });

    const handleScan = async (token: string) => {
        const result = await validateMutation.mutateAsync(token);
        return result;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Team Attendance</p>
                            <p className="text-xs text-muted-foreground">Panel de Admin</p>
                        </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={logout} className="gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Salir
                    </Button>
                </div>
            </header>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb">
                <div className="flex items-center justify-around py-2">
                    <button
                        onClick={() => setActiveTab('scanner')}
                        className={cn(
                            'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                            activeTab === 'scanner' ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span className="text-xs font-medium">Scanner</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={cn(
                            'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                            activeTab === 'calendar' ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium">Calendario</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('players')}
                        className={cn(
                            'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                            activeTab === 'players' ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-xs font-medium">Jugadores</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={cn(
                            'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                            activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-medium">Ajustes</span>
                    </button>
                </div>
            </nav>

            {/* Main content with bottom padding for nav */}
            <main className="pb-24 px-4 py-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'scanner' && (
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h2 className="text-xl font-bold mb-4">Escanear Asistencia</h2>
                            <QRScanner onScan={handleScan} />
                        </motion.div>
                    )}

                    {activeTab === 'calendar' && (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-xl font-bold">Calendario de Asistencia</h2>

                            <AttendanceCalendar
                                year={calendarYear}
                                month={calendarMonth}
                                attendanceCounts={calendarData?.attendanceCounts || {}}
                                totalPlayers={calendarData?.totalPlayers || 0}
                                events={calendarData?.events || []}
                                onDateClick={setSelectedDate}
                                onMonthChange={(y, m) => {
                                    setCalendarYear(y);
                                    setCalendarMonth(m);
                                }}
                            />

                            {/* Selected date details */}
                            <AnimatePresence>
                                {selectedDate && dateAttendance && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg">
                                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}
                                                </CardTitle>
                                                <CardDescription>
                                                    {dateAttendance.event?.type === 'match' ? '⚽ Partido' : '🏋️ Entrenamiento'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {dateAttendance.players?.map((player: any) => (
                                                        <div
                                                            key={player.id}
                                                            className={cn(
                                                                'flex items-center justify-between p-3 rounded-lg',
                                                                player.attended ? 'bg-green-500/10' : 'bg-muted/50'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback className={cn(
                                                                        'text-sm',
                                                                        player.attended ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'
                                                                    )}>
                                                                        {player.name?.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium">{player.name}</span>
                                                            </div>
                                                            {player.attended ? (
                                                                <span className="text-green-600 text-sm font-medium">✓ Presente</span>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">Ausente</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === 'players' && (
                        <motion.div
                            key="players"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Jugadores</h2>
                                <span className="text-sm text-muted-foreground">{players.length} jugadores</span>
                            </div>

                            {/* Add player form */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Añadir Jugador</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.target as HTMLFormElement;
                                            const name = (form.elements.namedItem('playerName') as HTMLInputElement).value;
                                            const email = (form.elements.namedItem('playerEmail') as HTMLInputElement).value;
                                            addPlayerMutation.mutate({ name, email });
                                            form.reset();
                                        }}
                                        className="flex flex-col sm:flex-row gap-3"
                                    >
                                        <Input name="playerName" placeholder="Nombre" required className="flex-1" />
                                        <Input name="playerEmail" type="email" placeholder="Email" required className="flex-1" />
                                        <Button type="submit" disabled={addPlayerMutation.isPending}>
                                            {addPlayerMutation.isPending ? 'Añadiendo...' : 'Añadir'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Players list */}
                            <div className="space-y-2">
                                {players.map((player: any) => (
                                    <Card key={player.id} className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                    {player.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{player.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{player.email}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// Main App
function AppContent() {
    const { user } = useAuth();

    if (!user) {
        return <LoginPage />;
    }

    if (user.role === 'admin') {
        return <AdminDashboard />;
    }

    return <PlayerDashboard />;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <div className="dark">
                    <AppContent />
                </div>
            </AuthProvider>
        </QueryClientProvider>
    );
}
