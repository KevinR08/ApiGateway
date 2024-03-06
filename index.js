// Dependencies
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { initializeApp } = require('firebase/app');
const { getFirestore, updateDoc, collection, query, limit, getDocs, where, getDoc, addDoc, doc, deleteDoc } = require('firebase/firestore');
const { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require("firebase/storage");
const multer = require('multer');
const bodyParser = require('body-parser');
const isAuthenticated =require('./firebaseAuthentication')
const firebaseConfig =require('./firebaseConfig')


// Conexión a Firebase
const appFirebase = initializeApp(firebaseConfig)
const auth = getAuth(appFirebase)
const db = getFirestore(appFirebase)
const firebaseStorage = getStorage(appFirebase)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



// Configuration
const PORT = process.env.PORT || 3000;
  const autosURL = 'https://microservice-autos.vercel.app';
const usuariosURL = 'https://microservicio-usuarios.vercel.app';

// Express app
const app = express();
app.use(cors()); // Replace with your frontend origin
app.use(bodyParser.json());

//Petición GET a API
app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`)
})

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params
  res.end(`Item: ${slug}`)
})

/*Microservicio para autos*/
app.get('/mostrar/autos', async (req, res) => {
    try {
      const response = await axios.get(`${autosURL}/api/read/cars`);
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
      res.status(500).json({ error: 'Failed to retrieve cars' });
    }
  });
  
  // Route for getting cars with limit
  app.get('/mostrar/autoslimite/:limit', async (req, res) => {
    try {
      const limit = parseInt(req.params.limit, 10) || 5;
      const response = await axios.get(`${autosURL}/api/read/cars/${limit}`);
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
      res.status(500).json({ error: 'Failed to retrieve cars' });
    }
  });
  
  app.get('/api/search/cars', async (req, res) => {
    try {
      const brand = req.query.brand;
      if (!brand) {
        return res.status(400).json({ error: 'Falta el parámetro de búsqueda "brand"' });
      }
      const response = await axios.get(`${autosURL}/api/search/cars`, { params: { brand } });
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Error buscando autos:', error);
      res.status(500).json({ error: 'Error al buscar autos' });
    }
  });

  // Crear un auto desde el API Gateway
app.post('/crear',isAuthenticated,  async (req, res) => {
  try {
    const carData = req.body;
    const token = req.headers.authorization;
    const response = await axios.post(`${autosURL}/api/create/car`, carData,{
    headers: {
      Authorization: token
    }
  });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error al crear el auto:', error);
    res.status(500).json({ error: 'Error al crear el auto' });
  }
});

// Ruta para actualizar un auto desde el API Gateway
app.put('/actualizar/:idCar', isAuthenticated, async (req, res) => {
  try {
    const idCar = req.params.idCar;
    const updatedData = req.body;
    const token = req.headers.authorization;
    const response = await axios.put(`${autosURL}/api/update/car/${idCar}`, updatedData, {
      headers: {
        Authorization: token
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error al actualizar el auto:', error);
    res.status(500).json({ error: 'Error al actualizar el auto' });
  }
});

// Ruta para eliminar un auto
app.delete('/eliminar/:idCar', isAuthenticated, async (req, res) => {
  try {
      const idCar = req.params.idCar;
      const response = await axios.delete(`${autosURL}/api/delete/car/${idCar}`, {
          headers: {
              Authorization: req.headers.authorization
          }
      });
      res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error al eliminar el auto:', error);
      res.status(500).json({ error: 'Error al eliminar el auto' });
  }
});

/***MICROSERVICIO PARA USUARIOS */

// Autenticación
app.get('/api/isAuth', isAuthenticated, async (req, res) => {
  try {
      const response = await axios.get(`${usuariosURL}/api/isAuth`, {
          headers: {
              Authorization: req.headers.authorization
          }
      });
      res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error en la verificación de autenticación:', error);
      res.status(500).json({ error: 'Error en la verificación de autenticación' });
  }
});

// Ruta para registro de usuario
app.post('/api/register', async (req, res) => {
  try {
      // Realiza la solicitud al microservicio para registrar un nuevo usuario
      const response = await axios.post(`${usuariosURL}/api/register`, req.body);
      // Enviar la respuesta del microservicio al cliente
      res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error en el registro de usuario:', error);
      res.status(500).json({ error: 'Error en el registro de usuario' });
  }
});

// Ruta para el endpoint de inicio de sesión
app.post('/api/login', async (req, res) => {
  try {
      // Realiza la solicitud al microservicio para iniciar sesión
      const response = await axios.post(`${usuariosURL}/api/login`, req.body);
      // Enviar la respuesta del microservicio al cliente
      res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error al iniciar sesión:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta para envío de correo de recuperación de contraseña
app.post('/api/user/reset-password', async (req, res) => {
  try {
      const response = await axios.post(`${usuariosURL}/api/user/reset-password`, req.body);
      res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error al enviar el correo de restablecimiento de contraseña:', error);
      res.status(500).json({ error: 'Error al enviar el correo de restablecimiento de contraseña' });
  }
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});