```markdown
# 🐳 TechRetail — Docker Swarm on AWS EC2

> Plataforma de comercio electrónico peruana modernizada con arquitectura de
> microservicios contenerizada y orquestada mediante Docker Swarm sobre
> infraestructura cloud en Amazon Web Services.

![Docker](https://img.shields.io/badge/Docker-29.1.3-2496ED?style=flat-square&logo=docker&logoColor=white)
![Docker Swarm](https://img.shields.io/badge/Docker%20Swarm-Enabled-2496ED?style=flat-square&logo=docker&logoColor=white)
![AWS EC2](https://img.shields.io/badge/AWS-EC2%20t3.micro-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![Ubuntu](https://img.shields.io/badge/Ubuntu-24.04%20LTS-E95420?style=flat-square&logo=ubuntu&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%20Alpine-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7%20Alpine-DC382D?style=flat-square&logo=redis&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=flat-square&logo=nginx&logoColor=white)

---

## 📑 Tabla de contenidos

- [Contexto del proyecto](#-contexto-del-proyecto)
- [Arquitectura del sistema](#-arquitectura-del-sistema)
- [Infraestructura en AWS](#-infraestructura-en-aws)
- [Servicios desplegados](#-servicios-desplegados)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Prerrequisitos](#-prerrequisitos)
- [Guía de despliegue](#-guía-de-despliegue)
- [Escalado dinámico](#-escalado-dinámico)
- [Seguridad](#-seguridad)
- [Monitoreo](#-monitoreo)
- [Comandos de referencia](#-comandos-de-referencia)
- [Problemas conocidos y soluciones](#-problemas-conocidos-y-soluciones)
- [Autor](#-autor)

---

## 📌 Contexto del proyecto

**TechRetail** es una empresa peruana de comercio electrónico fundada en 2020
que operaba su plataforma sobre un único servidor físico. Con el crecimiento
acelerado de usuarios durante campañas como el **Buen Fin** y los
**Cyber Days**, la arquitectura monolítica comenzó a mostrar sus límites:

| Problema | Impacto |
|---|---|
| Caídas frecuentes en horas pico | Pérdida de ventas y reputación |
| Tiempos de respuesta > 8 segundos | Abandono de carrito elevado |
| Imposibilidad de escalar rápidamente | Capacidad limitada ante demanda |
| Sin alta disponibilidad | S/. 15,000 por hora de inactividad |

Este repositorio documenta la solución implementada: migración a una
arquitectura de **microservicios contenerizada y orquestada con Docker Swarm**
desplegada sobre AWS EC2, resolviendo todos los problemas anteriores con
escalado horizontal automático, alta disponibilidad y balanceo de carga.

---

## 🏗️ Arquitectura del sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                   AWS EC2 — REGIÓN US-EAST-2                     │
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   MANAGER NODE   │  │  WORKER NODE 1  │  │  WORKER NODE 2  │ │
│  │  172.31.45.180   │  │  172.31.34.78   │  │  172.31.39.74   │ │
│  │                  │  │                 │  │                 │ │
│  │ ▸ visualizer     │  │ ▸ frontend      │  │ ▸ frontend      │ │
│  │ ▸ database       │  │ ▸ backend       │  │ ▸ frontend      │ │
│  │ ▸ frontend       │  │                 │  │ ▸ backend       │ │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                     │                    │           │
│           └─────────────────────┼────────────────────┘           │
│                                 │                                 │
│               ┌─────────────────▼─────────────────┐              │
│               │     RED OVERLAY: techretail_net    │              │
│               │          Driver: overlay           │              │
│               └───────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

El clúster utiliza una **red overlay** para la comunicación interna entre
todos los contenedores distribuidos en los diferentes nodos, abstrayendo
completamente la topología de red subyacente.

---

## ☁️ Infraestructura en AWS

| Nodo | Rol Swarm | IP Pública | IP Privada | Tipo |
|------|-----------|------------|------------|------|
| techretail-manager | Manager / Leader | 3.137.151.141 | 172.31.45.180 | t3.micro |
| techretail-worker1 | Worker | 18.220.127.205 | 172.31.34.78 | t3.micro |
| techretail-worker2 | Worker | 3.133.58.124 | 172.31.39.74 | t3.micro |

**Sistema operativo:** Ubuntu Server 24.04 LTS
**Docker Engine:** v29.1.3
**Región AWS:** us-east-2 (Ohio)

### Puertos habilitados en el Security Group

| Puerto | Protocolo | Uso |
|--------|-----------|-----|
| 22 | TCP | Administración SSH |
| 80 | TCP | Frontend web (Nginx) |
| 2377 | TCP | Gestión del clúster Swarm |
| 7946 | TCP/UDP | Comunicación entre nodos |
| 4789 | UDP | Red overlay VXLAN |
| 8080 | TCP | Visualizador del clúster |

---

## 🚀 Servicios desplegados

| Servicio | Imagen | Réplicas | Puerto | Nodo |
|----------|--------|----------|--------|------|
| frontend | nginx:alpine | 3 mín. / 5 escalado | 80 | Workers + Manager |
| backend | josuz/techretail-backend:latest | 2 | 3000 | Workers |
| database | mysql:8 | 1 | 3306 | Manager (constraint) |
| cache | redis:7-alpine | 1 | 6379 | Worker |
| visualizer | dockersamples/visualizer | 1 | 8080 | Manager (constraint) |

---

## 📁 Estructura del repositorio

```
docker-swarm-techretail/
│
├── docker-compose.yml        # Definición completa del stack Swarm
├── nginx.conf                # Configuración del servidor web y proxy reverso
│
└── backend/
    ├── server.js             # API REST minimal en Node.js (puerto 3000)
    └── Dockerfile            # Imagen personalizada basada en node:18-alpine
```

---

## ✅ Prerrequisitos

Antes de desplegar este stack necesitas:

- Tres instancias EC2 (o VMs) con Ubuntu Server 22.04+ o 24.04 LTS
- Docker Engine instalado en los tres nodos (ver sección de despliegue)
- Conectividad de red entre los tres nodos en los puertos 2377, 7946 y 4789
- Cuenta en Docker Hub para publicar la imagen del backend
- Acceso SSH a los tres nodos con un par de claves `.pem`

---

## 🛠️ Guía de despliegue

### 1. Instalar Docker en los 3 nodos

Ejecutar en **cada nodo** por separado vía SSH:

```bash
sudo apt update -y
sudo apt install -y docker.io
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker ubuntu
docker --version
```

---

### 2. Inicializar el clúster Swarm

En el **nodo Manager** ejecutar:

```bash
sudo docker swarm init --advertise-addr <IP_PRIVADA_MANAGER>
```

El comando genera un token único. Copiar el comando `docker swarm join`
completo que aparece en la salida y ejecutarlo en cada Worker:

```bash
# Ejecutar en Worker 1 y Worker 2
sudo docker swarm join --token <TOKEN_GENERADO> <IP_PRIVADA_MANAGER>:2377
```

Verificar que los 3 nodos están activos:

```bash
sudo docker node ls
```

---

### 3. Construir y publicar la imagen del backend

En el **nodo Manager** ejecutar:

```bash
sudo docker login
sudo docker build -t <TU_USUARIO_DOCKERHUB>/techretail-backend:latest ./backend/
sudo docker push <TU_USUARIO_DOCKERHUB>/techretail-backend:latest
```

> ⚠️ Actualizar el campo `image` del servicio `backend` en
> `docker-compose.yml` con tu usuario de Docker Hub antes de desplegar.

---

### 4. Crear el Docker Secret

```bash
echo "TU_PASSWORD_SEGURA" | sudo docker secret create db_password -
```

Verificar:

```bash
sudo docker secret ls
```

---

### 5. Desplegar el stack completo

```bash
sudo docker stack deploy -c docker-compose.yml techretail
```

Verificar el estado de los servicios (esperar 1-2 minutos):

```bash
sudo docker stack services techretail
```

La salida esperada muestra todas las réplicas en estado activo:

```
ID             NAME                    MODE         REPLICAS
xxxxx          techretail_backend      replicated   2/2
xxxxx          techretail_cache        replicated   1/1
xxxxx          techretail_database     replicated   1/1
xxxxx          techretail_frontend     replicated   3/3
xxxxx          techretail_visualizer   replicated   1/1
```

---

## 📈 Escalado dinámico

Docker Swarm permite escalar servicios en tiempo de ejecución sin
interrumpir el servicio. Para escalar el frontend a 5 réplicas:

```bash
sudo docker service scale techretail_frontend=5
```

El sistema distribuye automáticamente las nuevas réplicas entre los nodos
disponibles y confirma el progreso en tiempo real:

```
techretail_frontend scaled to 5
overall progress: 5 out of 5 tasks
1/5: running   2/5: running   3/5: running   4/5: running   5/5: running
verify: Service techretail_frontend converged
```

Para verificar la distribución de réplicas entre nodos:

```bash
sudo docker service ps techretail_frontend
```

---

## 🔐 Seguridad

### Docker Secrets

Las credenciales de la base de datos se gestionan mediante Docker Secrets,
que almacenan la información cifrada en el Raft log del Swarm. Los secrets
se montan como archivos en `/run/secrets/` dentro del contenedor, sin
exponerse en variables de entorno ni en el `docker-compose.yml`.

```bash
# Ver secrets registrados en el clúster
sudo docker secret ls
```

### Docker Configs

La configuración de Nginx se gestiona mediante Docker Configs, permitiendo
actualizar la configuración del servidor web de forma centralizada y
distribuirla automáticamente a todas las réplicas del frontend.

```bash
# Ver configs registrados en el clúster
sudo docker config ls
```

---

## 📊 Monitoreo

### Visualizador del clúster

El servicio visualizer proporciona un dashboard gráfico en tiempo real
accesible desde el navegador:

```
http://<IP_PUBLICA_MANAGER>:8080
```

Muestra la distribución de todos los contenedores entre los nodos del
clúster, actualizándose automáticamente ante cualquier cambio de estado.

### Logs de servicios

```bash
# Logs en tiempo real del backend (todas las réplicas agregadas)
sudo docker service logs techretail_backend

# Logs del frontend
sudo docker service logs techretail_frontend
```

### Estado detallado de réplicas

```bash
sudo docker service ps techretail_frontend
sudo docker service ps techretail_backend
```

---

## 📋 Comandos de referencia

```bash
# Ver todos los nodos del clúster
sudo docker node ls

# Ver todos los servicios del stack
sudo docker stack services techretail

# Ver réplicas de un servicio específico
sudo docker service ps <nombre_servicio>

# Escalar un servicio
sudo docker service scale <nombre_servicio>=<N>

# Ver logs de un servicio
sudo docker service logs <nombre_servicio>

# Eliminar el stack completo
sudo docker stack rm techretail

# Sacar un nodo del clúster (ejecutar en el nodo a retirar)
sudo docker swarm leave

# Sacar el Manager del clúster (forzado)
sudo docker swarm leave --force
```

---

## 🐛 Problemas conocidos y soluciones

**YAML pierde indentación al usar heredoc en SSH**

Al crear archivos YAML directamente en la terminal SSH desde Windows,
la indentación puede corromperse. Solución: crear los archivos en VSCode
localmente y transferirlos con SCP.

```bash
scp -i ~/ruta/clave.pem archivo.yml ubuntu@<IP>:~/techretail/
```

**Template literals JavaScript corruptos en heredoc**

Los backticks de JavaScript son interpretados por bash como subcomandos.
Solución: usar concatenación con `+` en lugar de template literals, o
transferir el archivo desde local mediante SCP.

**Desconexión SSH en instancias t3.micro bajo carga**

Las instancias t3.micro con 1 GB de RAM pueden cerrar sesiones SSH
cuando la memoria está bajo presión. Solución: minimizar procesos activos
durante la edición o usar instancias de mayor capacidad en producción.

---

## 👤 Autor

**Josue Zapata**
Estudiante de Desarrollo de Software — Instituto Tecsup, Lima, Perú

[![GitHub](https://img.shields.io/badge/GitHub-Josue--Zapata--v-181717?style=flat-square&logo=github)](https://github.com/Josue-Zapata-v)

---

## 📚 Referencias

- [Docker Swarm Documentation](https://docs.docker.com/engine/swarm/)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
- [Docker Configs](https://docs.docker.com/engine/swarm/configs/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)

---

*Instituto Tecsup — Curso: Desarrollo de Aplicaciones en la Nube — Lima, Perú — Mayo 2026*

