import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/user.js';
// Asume que tienes un modelo User definido en otro archivo

const routerLogin = express.Router();

// Ruta de registro
// Ruta de registro
routerLogin.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Definir el número de rondas de hashing
        const saltRounds = 10;

        // Generar el hash de la contraseña con el número de rondas definido
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


// Ruta de inicio de sesión
routerLogin.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const token = jwt.sign({ email: user.email }, '@system64', { expiresIn: '1h' });

            res.cookie('token', token, { httpOnly: true });

            res.status(200).json({ message: 'Inicio de sesión exitoso' });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta de cierre de sesión
routerLogin.post('/logout', (req, res) => {
    // Verifica si hay una cookie de token
    console.log(req.cookies)
    if (req.cookies.token) {
        // Elimina la cookie que contiene el token
        res.clearCookie('token');
        res.status(200).json({ message: 'Cierre de sesión exitoso' });
    } else {
        res.status(400).json({ error: 'No hay una sesión activa' });
    }
});

// Ruta protegida
routerLogin.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Ruta protegida, solo accesible con token válido' });
});

// Función para verificar el token de autenticación
function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    }

    jwt.verify(token, 'tu_secreto', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token de autenticación inválido' });
        }
        req.user = decoded;
        next();
    });
}

export { routerLogin };
