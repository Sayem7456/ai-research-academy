/**
 * MathPractice - Practice section component for math lessons
 * Phase 9: Mathematics Module
 *
 * Renders MCQ, coding, and math practice questions with
 * answer checking, hints, and XP rewards.
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { PracticeQuestion } from '../types';

interface MathPracticeProps {
  questions: PracticeQuestion[];
  lessonTitle: string;
  onSolveProblem: (
    problemId: string,
    lessonId: string,
    problemName: string,
    difficulty: 'easy' | 'medium' | 'hard',
    attempts: number
  ) => void;
  solvedProblemIds?: string[];
  onBack?: () => void;
}

export default function MathPractice({
  questions,
  lessonTitle,
  onSolveProblem,
  solvedProblemIds = [],
  onBack,
}: MathPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [codeAnswer, setCodeAnswer] = useState('');
  const [mathAnswer, setMathAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);

  const currentQuestion = questions[currentIndex];

  const resetState = useCallback(() => {
    setSelectedAnswer('');
    setCodeAnswer('');
    setMathAnswer('');
    setShowHint(false);
    setShowExplanation(false);
    setIsCorrect(null);
    setAttempts(0);
  }, []);

  const checkAnswer = useCallback(() => {
    if (!currentQuestion) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    let userAnswer = '';
    switch (currentQuestion.type) {
      case 'mcq':
        userAnswer = selectedAnswer;
        break;
      case 'coding':
        userAnswer = codeAnswer.trim();
        break;
      case 'math':
        userAnswer = mathAnswer.trim();
        break;
    }

    const correct = normalizeAnswer(userAnswer) === normalizeAnswer(currentQuestion.correctAnswer);
    setIsCorrect(correct);
    setShowExplanation(true);

    if (correct) {
      onSolveProblem(
        currentQuestion.id,
        currentQuestion.lessonId,
        `${currentQuestion.type}: ${currentQuestion.question.slice(0, 50)}...`,
        currentQuestion.difficulty,
        newAttempts
      );
    }
  }, [currentQuestion, selectedAnswer, codeAnswer, mathAnswer, attempts, onSolveProblem]);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetState();
    }
  }, [currentIndex, questions.length, resetState]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetState();
    }
  }, [currentIndex, resetState]);

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 text-center">
          <span className="text-4xl mb-4 block">📝</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Practice Questions Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Practice questions for this lesson are coming soon.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Lesson
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Practice: {lessonTitle}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Back to Lesson
          </button>
        )}
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          {/* Question Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              currentQuestion.type === 'mcq' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              currentQuestion.type === 'coding' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            }`}>
              {currentQuestion.type === 'mcq' ? 'Multiple Choice' :
               currentQuestion.type === 'coding' ? 'Coding' : 'Math Problem'}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {currentQuestion.xp} XP
            </span>
            {solvedProblemIds.includes(currentQuestion.id) && (
              <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                Solved
              </span>
            )}
          </div>

          {/* Question */}
          <p className="text-lg text-gray-900 dark:text-gray-100 mb-6">
            {currentQuestion.question}
          </p>

          {/* Answer Input */}
          {currentQuestion.type === 'mcq' && currentQuestion.options && (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                const showResult = showExplanation;
                const isCorrectOption = opt.id === currentQuestion.correctAnswer;

                let borderClass = 'border-gray-200 dark:border-gray-700';
                if (isSelected && !showResult) borderClass = 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20';
                if (showResult && isCorrectOption) borderClass = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                if (showResult && isSelected && !isCorrectOption) borderClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';

                return (
                  <button
                    key={opt.id}
                    onClick={() => !showExplanation && setSelectedAnswer(opt.id)}
                    disabled={showExplanation}
                    className={`w-full text-left p-4 rounded-lg border-2 ${borderClass} transition-colors ${
                      showExplanation ? 'cursor-default' : 'hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
                        {opt.id.toUpperCase()}
                      </span>
                      <span className="text-gray-800 dark:text-gray-200">{opt.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'coding' && (
            <div className="mb-6">
              <textarea
                value={codeAnswer}
                onChange={(e) => setCodeAnswer(e.target.value)}
                disabled={showExplanation}
                placeholder={currentQuestion.codeTemplate || 'Write your solution here...'}
                className="w-full h-48 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                spellCheck={false}
              />
            </div>
          )}

          {currentQuestion.type === 'math' && (
            <div className="mb-6">
              <input
                type="text"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                disabled={showExplanation}
                placeholder="Enter your answer..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Hint */}
          {currentQuestion.hint && !showHint && !showExplanation && (
            <button
              onClick={() => setShowHint(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
            >
              Show hint
            </button>
          )}
          {showHint && currentQuestion.hint && (
            <div className="p-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Hint:</strong> {currentQuestion.hint}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!showExplanation ? (
              <button
                onClick={checkAnswer}
                disabled={
                  (currentQuestion.type === 'mcq' && !selectedAnswer) ||
                  (currentQuestion.type === 'coding' && !codeAnswer.trim()) ||
                  (currentQuestion.type === 'math' && !mathAnswer.trim())
                }
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Check Answer
              </button>
            ) : (
              <div className="flex items-center gap-4">
                {isCorrect ? (
                  <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Correct! +{currentQuestion.xp} XP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Incorrect — try reviewing the explanation
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`mt-6 p-4 rounded-lg border ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Explanation</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {currentQuestion.explanation}
              </p>
              {currentQuestion.type === 'coding' && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Solution:</h5>
                  <pre className="p-3 bg-gray-900 text-green-400 rounded-md text-xs overflow-x-auto">
                    <code>{currentQuestion.correctAnswer}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Previous
        </button>
        <div className="flex gap-1.5">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); resetState(); }}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx === currentIndex
                  ? 'bg-blue-500'
                  : solvedProblemIds.includes(questions[idx].id)
                    ? 'bg-green-400'
                    : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
        <button
          onClick={goToNext}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * Normalize answer for comparison (lowercase, trim, collapse whitespace)
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[;]$/, '');
}
