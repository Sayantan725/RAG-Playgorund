# AI RAG Playground

A premium, interactive full-stack web application built with Next.js for testing and visualizing Retrieval-Augmented Generation (RAG) parameters and performance metrics.

## Features

- **Dynamic RAG Configuration**: Interactively test and tweak RAG parameters including Chunk Size, Chunk Overlap, and Top K in real-time.
- **Performance Visualization**: Easily monitor critical metrics such as Retrieval Latency, Generation Latency, and Response Confidence Scores.
- **PDF Parsing**: Built-in support for ingesting and parsing PDF documents directly within the Next.js environment.
- **Premium Interface**: A modern, sleek, and highly responsive user interface designed for an optimal AI testing experience.
- **Vercel-Ready**: Fully configured for seamless deployment on Vercel.

## Getting Started

First, make sure you have your API keys ready (e.g., your Gemini API Key) and placed in a local `.env.local` file at the root of the project:

```env
GEMINI_API_KEY=your_api_key_here
```

Then, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application in action.
