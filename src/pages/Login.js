import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const Login = () => {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Endpoint: POST /api/login
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, contrasena }),
            });

            const data = await response.json();

            if (response.ok) {
                // La API devuelve el token si el login es exitoso
                login(data.token);
            } else {
                // Muestra el mensaje de error de la API (ej: 'Usuario no encontrado')
                setError(data.msg || 'Error de inicio de sesión desconocido');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Usuario:</label>
                    <input
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', margin: '5px 0' }}
                    />
                </div>
                <div>
                    <label>Contraseña:</label>
                    <input
                        type="password"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', margin: '5px 0' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
                    Entrar
                </button>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </form>
            <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                **Credenciales de prueba:**<br />
                Admin: **admin** / **123456**<br />
                Alumno: **jpleon** / **123456** (ID 2) o **test** / **123456** (ID 3)
            </p>
        </div>
    );
};

export default Login;