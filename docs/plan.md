# AI Research Learning Platform
## Vision

A visually rich, research-oriented AI learning platform that takes learners from:

Mathematics
→ Traditional Machine Learning
→ Deep Learning
→ Computer Vision
→ Large Language Models
→ Reading Papers
→ Reproducing Research
→ Publishing Research

Target Users:
- Undergraduate students
- Graduate students
- Self-learners
- Aspiring AI Researchers
- Research Engineers

Architecture:
- Frontend Only
- Next.js 15
- TypeScript
- Tailwind CSS
- Framer Motion
- MDX Content
- No Backend
- No Database
- Hosted on Vercel

All user progress stored locally.

---

# Core Philosophy

Most AI courses teach:

Theory
+
Coding

This platform teaches:

Theory
+
Visualization
+
Mathematics
+
Implementation
+
Research Perspective

Every topic should answer:

1. What problem does it solve?
2. Why was it invented?
3. Mathematical intuition
4. Visual intuition
5. Algorithm workflow
6. Complexity analysis
7. Python implementation
8. Research limitations
9. Modern improvements
10. Papers to read

---

# Site Structure

Home

├── Mathematics
├── Traditional Machine Learning
├── Computer Vision
├── LLM
├── Research Skills
├── Coding Practice
├── Paper Reading
├── Progress Dashboard
└── Notes

---

# Mathematics Track

## 1. Linear Algebra

Topics:

- Scalars
- Vectors
- Matrices
- Tensor
- Matrix Multiplication
- Determinant
- Eigenvalues
- Eigenvectors
- SVD
- PCA Mathematics

Visual Components:

- Matrix Transformation Viewer
- Eigenvector Visualizer
- PCA Visualizer

Practice:
- MCQ
- Coding
- Math Problems

---

## 2. Calculus

Topics:

- Limits
- Derivatives
- Chain Rule
- Partial Derivatives
- Gradients
- Jacobian
- Hessian
- Optimization

Visual:

- Interactive Gradient Descent

Practice:
- Symbolic
- Numerical

---

## 3. Probability

Topics:

- Random Variables
- Distribution
- Bayes Theorem
- Likelihood
- MLE
- MAP

Visual:

- Distribution Explorer
- Bayesian Update Animation

---

## 4. Statistics

Topics:

- Hypothesis Testing
- Confidence Interval
- Correlation
- Covariance

Visual:

- Sampling Simulator

---

# Traditional Machine Learning

## Fundamentals

- Supervised Learning
- Unsupervised Learning
- Reinforcement Learning

Visual:

Flow diagrams

---

## Linear Regression

Sections:

Problem
Math
Visualization
Implementation
Research Notes

Interactive:

- Move points
- Observe regression line

Practice:
- Implement from scratch

---

## Logistic Regression

Visual:
Decision Boundary Explorer

Practice:
- Binary Classification

---

## KNN

Visual:
Neighbor Selection Animation

Practice:
- Build KNN

---

## Naive Bayes

Visual:
Probability Computation Animation

---

## Decision Tree

Visual:
Tree Growth Animation

---

## Random Forest

Visual:
Multiple Trees Ensemble

---

## SVM

Visual:
Hyperplane Explorer

---

## PCA

Visual:
Dimensionality Reduction

---

## K-Means

Visual:
Cluster Formation Animation

---

# Computer Vision

## Image Fundamentals

- Pixels
- Channels
- RGB
- HSV

Visual:
Image Inspector

---

## CNN

Visual:

Interactive CNN Simulator

Show:

Image
→ Conv
→ ReLU
→ Pool
→ FC

---

## ResNet

Visual:
Residual Connection Animation

---

## U-Net

Visual:
Encoder Decoder Animation

---

## Vision Transformer

Visual:
Patch Embedding Explorer

---

## Object Detection

Topics:

- R-CNN
- Fast R-CNN
- Faster R-CNN
- YOLO

Visual:
Bounding Box Animation

---

## Segmentation

Visual:
Mask Prediction

---

## Medical Imaging

Topics:

- Classification
- Segmentation
- Detection

Research Focus:
- Xray
- MRI
- CT

---

# Large Language Models

## NLP Foundations

- Tokenization
- Embeddings
- Word2Vec
- Attention

Visual:
Embedding Space Explorer

---

## Transformer

Visual:

Animated Transformer

User can inspect:

- Query
- Key
- Value
- Attention Scores

---

## Self Attention

Interactive Matrix Visualizer

---

## Positional Encoding

Animated Sine Wave Explorer

---

## BERT

Architecture Breakdown

---

## GPT

Architecture Breakdown

---

## Fine Tuning

Visual Pipeline

---

## RAG

Visual Pipeline

User can see:

Documents
→ Retrieval
→ Context
→ LLM

---

## Agent Systems

Visual:

Tool Calling
Memory
Planning

---

# Research Skills

## Reading Papers

Topics:

- Abstract
- Methodology
- Results
- Discussion

Practice:
Analyze real papers.

---

## Reproducing Papers

Roadmap

1. Understand
2. Reimplement
3. Compare

---

## Writing Papers

Structure:

- Abstract
- Introduction
- Method
- Results

---

## Research Ethics

Topics:

- Data Leakage
- Bias
- Reproducibility

---

# Coding Practice System

Each topic contains:

Easy
Medium
Hard

---

Example:

Linear Regression

Easy:
Implement MSE

Medium:
Gradient Descent

Hard:
Complete Linear Regression

---

Structure

Question

Hints

Answer

Explanation

Complexity

Research Notes

---

# Visual Learning System

Every algorithm includes:

1. Concept Diagram
2. Flow Animation
3. Mathematical Derivation
4. Interactive Playground

---

# Paper Recommendation Engine

Static JSON

For every topic:

{
  "title": "",
  "year": "",
  "difficulty": ""
}

No backend needed.

---

# Progress Tracking

Store in localStorage

{
  completedTopics: [],
  notes: [],
  solvedProblems: []
}

---

# Personal Notes

Users can save:

- Notes
- Formulas
- Research Ideas

Store in IndexedDB

---

# Search

Use:

Fuse.js

Static Search

No backend.

---

# Tech Stack

Framework:
- Next.js 15

Language:
- TypeScript

Styling:
- TailwindCSS

Animation:
- Framer Motion

Content:
- MDX

Charts:
- Recharts

Math:
- MathJax

Syntax Highlight:
- Shiki

Code Editor:
- Monaco Editor

State:
- Zustand

Storage:
- localStorage
- IndexedDB

Search:
- Fuse.js

Deployment:
- Vercel

---

# Folder Structure

src/

app/

components/

features/

math/

machine-learning/

computer-vision/

llm/

research/

practice/

content/

math/
ml/
cv/
llm/

data/

algorithms.json
papers.json
roadmaps.json

hooks/

store/

utils/

public/

---

# Future Phase 2

Optional Backend

- User Accounts
- Cloud Sync
- Leaderboard
- Discussion Forum
- Paper Annotation
- AI Tutor

Current version does not require any backend.