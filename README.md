# 🐳 Docker Swarm - TechRetail

Despliegue de aplicaciones con orquestación de contenedores Docker Swarm para la empresa TechRetail.

## 📋 Descripción

TechRetail es una empresa peruana de comercio electrónico que migró su infraestructura a una arquitectura de microservicios contenerizada usando Docker Swarm en AWS EC2.

## 🏗️ Arquitectura

- **1 nodo Manager** - Orquestación y base de datos
- **2 nodos Worker** - Distribución de servicios

## 🚀 Servicios desplegados

| Servicio | Imagen | Réplicas | Puerto |
|----------|--------|----------|--------|
| Frontend | nginx:alpine | 3 (escalable a 5) | 80 |
| Backend | josuz/techretail-backend | 2 | 3000 |
| Database | mysql:8 | 1 | 3306 |
| Cache | redis:7-alpine | 1 | 6379 |
| Visualizer | dockersamples/visualizer | 1 | 8080 |

## 🔧 Tecnologías

- Docker Swarm
- AWS EC2 (t2.micro)
- Ubuntu Server 24.04 LTS
- Nginx, Node.js, MySQL 8, Redis

## 📦 Estructura del proyecto
docker-swarm-techretail/
├── docker-compose.yml
├── nginx.conf
└── backend/
├── server.js
└── Dockerfile

## ⚙️ Comandos principales

### Inicializar el clúster
```bash
docker swarm init --advertise-addr <IP_MANAGER>
```

### Crear el secret
```bash
echo "TechRetail2024Secure!" | docker secret create db_password -
```

### Desplegar el stack
```bash
docker stack deploy -c docker-compose.yml techretail
```

### Ver servicios
```bash
docker stack services techretail
```

### Escalar el frontend
```bash
docker service scale techretail_frontend=5
```

### Ver logs
```bash
docker service logs techretail_backend
```

## 🔐 Seguridad

- **Docker Secrets** para credenciales de base de datos
- **Docker Configs** para configuración de Nginx

## 👤 Autor

Josue Zapata - [@Josue-Zapata-v](https://github.com/Josue-Zapata-v)
Instituto Tecsup - Desarrollo de Aplicaciones en la Nube
