<img width="1289" alt="image" src="https://github.com/user-attachments/assets/4736580c-fb18-46a9-b94e-ddcc355683c7" />

# Opinion Trading Platform Backend

## Overview

This repository contains the backend implementation for an opinion trading platform. It is designed to provide scalable, efficient, and real-time services using modern technologies. The architecture follows a modular approach, ensuring dynamic scaling based on workload, and incorporates asynchronous task processing, low-latency operations, and real-time interactions.

## Features

- **Modular Design**: Services are decoupled to enable dynamic scaling based on workload.
- **Asynchronous Task Processing**: Utilizes Redis queues and Pub/Subs for efficient background task execution.
- **Low-Latency Operations**: Implements in-memory caching with Redis for fast data access.
- **Durable Storage**: Ensures data persistence using Amazon S3 for archival purposes.
- **Real-Time Interactions**: Replaces polling with a WebSocket server for live updates.
- **Relational Database**: PostgreSQL is used with Prisma ORM for structured data management.
- **Archived Data Storage**: Non-essential data is stored in PostgreSQL to reduce the workload on the main engine.

## Tech Stack

### Core Technologies

- **Node.js with Express**: Backend framework for building scalable APIs.
- **Redis**: In-memory data structure store for caching, Pub/Sub, and task queues.
- **Amazon S3**: Cloud-based object storage for durable data persistence.
- **WebSocket**: Enables real-time, bidirectional communication between clients and the server.
- **PostgreSQL with Prisma**: Relational database with a type-safe ORM.

