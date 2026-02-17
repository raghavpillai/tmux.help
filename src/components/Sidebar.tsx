import { useState, useEffect, useMemo, useCallback } from 'react';
import { KeyCombo } from './key-combo';
import type { Chapter, Lesson, KeyCombo as KeyComboType } from '../lessons/curriculum';
import type { AppMode } from '../app';
import { taskPool } from '../challenges/challenges';

interface SidebarProps {
  mode: AppMode;
  onModeSwitch: (mode: AppMode) => void;
  curriculum: Chapter[];
  currentLessonId: string;
  completedLessons: Set<string>;
  onLessonSelect: (lessonId: string) => void;
  hintIndex: number;
  onRequestHint: () => void;
  currentTaskIndex: number | null;
  streak: number;
  onSkipTask: () => void;
}

export function Sidebar({
  mode,
  onModeSwitch,
  curriculum,
  currentLessonId,
  completedLessons,
  onLessonSelect,
  hintIndex,
  onRequestHint,
  currentTaskIndex,
  streak,
  onSkipTask,
}: SidebarProps) {
  return (
    <div
      className="flex flex-col h-full select-none overflow-hidden"
      style={{
        background: '#0a0e14',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        fontFamily: "'Geist Mono', monospace",
      }}
    >
      <div
        className="shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div style={{ padding: '20px 28px 0 20px' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[15px] font-bold" style={{ color: '#41b65c' }}>
              tmux
            </span>
            <span className="text-[15px] font-bold" style={{ color: '#c5cdd8' }}>
              .help
            </span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: '#565e6a' }}>
            Interactive tmux tutorial
          </p>
        </div>

        <div className="flex" style={{ padding: '0 20px' }}>
          <button
            className="flex-1 py-2 text-[11px] font-semibold text-center transition-colors duration-100"
            style={{
              color: mode === 'learn' ? '#41b65c' : '#565e6a',
              borderBottom: mode === 'learn' ? '2px solid #41b65c' : '2px solid transparent',
            }}
            onClick={() => onModeSwitch('learn')}
          >
            Learn
          </button>
          <button
            className="flex-1 py-2 text-[11px] font-semibold text-center transition-colors duration-100"
            style={{
              color: mode === 'challenge' ? '#dba036' : '#565e6a',
              borderBottom: mode === 'challenge' ? '2px solid #dba036' : '2px solid transparent',
            }}
            onClick={() => onModeSwitch('challenge')}
          >
            Challenge
          </button>
        </div>
      </div>

      {mode === 'learn' ? (
        <LearnPanel
          curriculum={curriculum}
          currentLessonId={currentLessonId}
          completedLessons={completedLessons}
          onLessonSelect={onLessonSelect}
          hintIndex={hintIndex}
          onRequestHint={onRequestHint}
        />
      ) : (
        <ChallengePanel
          currentTaskIndex={currentTaskIndex}
          streak={streak}
          onSkip={onSkipTask}
        />
      )}
    </div>
  );
}

function LearnPanel({
  curriculum,
  currentLessonId,
  completedLessons,
  onLessonSelect,
  hintIndex,
  onRequestHint,
}: {
  curriculum: Chapter[];
  currentLessonId: string;
  completedLessons: Set<string>;
  onLessonSelect: (lessonId: string) => void;
  hintIndex: number;
  onRequestHint: () => void;
}) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const currentLesson = findLesson(curriculum, currentLessonId);
  const currentChapter = findChapterForLesson(curriculum, currentLessonId);

  useEffect(() => {
    if (currentChapter) {
      setExpandedChapter(currentChapter.id);
    }
  }, [currentChapter?.id]);

  const totalLessons = useMemo(
    () => curriculum.reduce((sum, ch) => sum + ch.lessons.length, 0),
    [curriculum],
  );
  const progressPercent = (completedLessons.size / totalLessons) * 100;

  return (
    <>
      <div className="shrink-0" style={{ padding: '12px 28px 12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-[5px] rounded-full overflow-hidden"
            style={{ background: '#171d26' }}
            role="progressbar"
            aria-valuenow={completedLessons.size}
            aria-valuemin={0}
            aria-valuemax={totalLessons}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100
                  ? '#41b65c'
                  : 'linear-gradient(90deg, #41b65c, #4e9af5)',
              }}
            />
          </div>
          <span className="text-[10px] shrink-0 tabular-nums" style={{ color: '#565e6a' }}>
            {completedLessons.size}/{totalLessons}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 sidebar-scroll">
        {curriculum.map((chapter) => {
          const isExpanded = expandedChapter === chapter.id;
          const chapterCompleted = chapter.lessons.every((l) =>
            completedLessons.has(l.id)
          );
          const chapterProgress = chapter.lessons.filter((l) =>
            completedLessons.has(l.id)
          ).length;

          return (
            <div key={chapter.id} className="mb-0.5">
              <button
                className={`sidebar-chapter w-full flex items-center gap-2 py-[9px] text-left text-[11px] transition-colors duration-100${isExpanded ? ' expanded' : ''}`}
                style={{
                  color: chapterCompleted ? '#41b65c' : '#c5cdd8',
                  padding: '9px 28px 9px 20px',
                }}
                onClick={() =>
                  setExpandedChapter(isExpanded ? null : chapter.id)
                }
                aria-expanded={isExpanded}
                aria-label={`${chapter.title} - ${chapterProgress} of ${chapter.lessons.length} complete`}
              >
                <span className="text-sm">{chapter.icon}</span>
                <span className="flex-1 font-semibold truncate">{chapter.title}</span>
                <span
                  className="text-[10px] shrink-0 tabular-nums"
                  style={{ color: chapterCompleted ? '#41b65c' : '#565e6a' }}
                >
                  {chapterProgress}/{chapter.lessons.length}
                </span>
                <span
                  className="text-[9px] transition-transform duration-150"
                  style={{
                    color: '#565e6a',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                  }}
                >
                  {'\u25B6'}
                </span>
              </button>

              {isExpanded && (
                <div className="py-0.5">
                  {chapter.lessons.map((lesson) => {
                    const isCompleted = completedLessons.has(lesson.id);
                    const isCurrent = lesson.id === currentLessonId;

                    return (
                      <button
                        key={lesson.id}
                        className={`sidebar-lesson w-full flex items-center gap-2 text-left text-[11px] transition-colors duration-100${isCurrent ? ' current' : ''}`}
                        style={{
                          color: isCompleted
                            ? '#41b65c'
                            : isCurrent
                            ? '#4e9af5'
                            : '#565e6a',
                          borderLeft: isCurrent
                            ? '2px solid #4e9af5'
                            : '2px solid transparent',
                          padding: '6px 28px 6px 36px',
                        }}
                        onClick={() => onLessonSelect(lesson.id)}
                        aria-label={`${lesson.title}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        <span className="w-4 text-center shrink-0 text-[10px]">
                          {isCompleted ? '\u2713' : isCurrent ? '\u25CF' : '\u25CB'}
                        </span>
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {currentLesson && (
        <div
          className="shrink-0 overflow-y-auto sidebar-scroll"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            maxHeight: '45%',
            background: '#0e1219',
            padding: '16px 28px 16px 20px',
          }}
        >
          <h3
            className="text-[11px] font-semibold mb-2"
            style={{ color: '#4e9af5' }}
          >
            {currentLesson.title}
          </h3>
          <p
            className="text-[11px] leading-[1.7] mb-3"
            style={{ color: '#8b95a3' }}
          >
            {currentLesson.description}
          </p>

          <div
            className="rounded-md px-3 py-2.5 mb-3 text-[11px]"
            style={{
              background: '#0a0e14',
              border: '1px solid #1e2630',
            }}
          >
            <div
              className="text-[9px] uppercase font-bold mb-1.5 tracking-[0.1em]"
              style={{ color: '#dba036' }}
            >
              Objective
            </div>
            <div style={{ color: '#c5cdd8' }}>{currentLesson.objective}</div>
          </div>

          {currentLesson.keysToShow && currentLesson.keysToShow.length > 0 && (
            <div className="mb-3">
              {currentLesson.keysToShow.map((combo: KeyComboType, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <KeyCombo
                    keys={combo.keys}
                    isSequential={combo.isSequential}
                    size="sm"
                  />
                  <span
                    className="text-[10px]"
                    style={{ color: '#565e6a' }}
                  >
                    {combo.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {currentLesson.hints.length > 0 && (
            <div>
              {hintIndex < currentLesson.hints.length ? (
                <>
                  {Array.from({ length: hintIndex }).map((_, i) => (
                    <div
                      key={i}
                      className="text-[10px] mb-1.5 px-3 py-2 rounded"
                      style={{
                        background: '#0a0e14',
                        border: '1px solid #1e2630',
                        color: '#dba036',
                      }}
                    >
                      Hint {i + 1}: {currentLesson.hints[i]}
                    </div>
                  ))}
                  <button
                    className="sidebar-hint-link text-[10px] mt-1 transition-colors duration-100"
                    onClick={onRequestHint}
                  >
                    {hintIndex === 0 ? 'Need a hint?' : 'Another hint?'}
                  </button>
                </>
              ) : (
                currentLesson.hints.map((hint, i) => (
                  <div
                    key={i}
                    className="text-[10px] mb-1.5 px-3 py-2 rounded"
                    style={{
                      background: '#0a0e14',
                      border: '1px solid #1e2630',
                      color: '#dba036',
                    }}
                  >
                    Hint {i + 1}: {hint}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ChallengePanel({
  currentTaskIndex,
  streak,
  onSkip,
}: {
  currentTaskIndex: number | null;
  streak: number;
  onSkip: () => void;
}) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [currentTaskIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setShowHint((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const task = currentTaskIndex !== null ? taskPool[currentTaskIndex] : null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="shrink-0 flex items-center justify-between"
        style={{ padding: '14px 28px 14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[10px]" style={{ color: '#565e6a' }}>Streak</span>
        <span className="text-[13px] font-bold tabular-nums" style={{ color: streak > 0 ? '#dba036' : '#565e6a' }}>
          {streak}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '0 28px' }}>
        {task ? (
          <>
            <div
              className="text-[9px] uppercase font-bold tracking-[0.1em] mb-4"
              style={{ color: '#565e6a' }}
            >
              Your task
            </div>
            <div
              className="text-[13px] font-semibold text-center leading-[1.6] mb-6"
              style={{ color: '#c5cdd8' }}
            >
              {task.instruction}
            </div>

            <button
              className="text-[10px] transition-colors duration-100 mb-2"
              style={{ color: showHint ? '#dba036' : '#565e6a' }}
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? '\u25BC Hide hint' : '\u25B6 Show hint (h)'}
            </button>
            {showHint && (
              <div
                className="text-[10px] px-3 py-2 rounded text-center"
                style={{
                  background: '#0a0e14',
                  border: '1px solid #1e2630',
                  color: '#dba036',
                }}
              >
                {task.hint}
              </div>
            )}
          </>
        ) : (
          <div className="text-[11px] text-center" style={{ color: '#565e6a' }}>
            No task available for the current state.
          </div>
        )}
      </div>

      {task && (
        <div
          className="shrink-0"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: '#0e1219',
            padding: '12px 28px 12px 20px',
          }}
        >
          <button
            className="w-full text-[10px] py-2 rounded transition-colors duration-100"
            style={{
              color: '#565e6a',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'transparent',
            }}
            onClick={onSkip}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.color = '#8b95a3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#565e6a';
            }}
          >
            Skip (resets streak)
          </button>
        </div>
      )}
    </div>
  );
}

function findLesson(curriculum: Chapter[], lessonId: string): Lesson | undefined {
  for (const chapter of curriculum) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

function findChapterForLesson(curriculum: Chapter[], lessonId: string): Chapter | undefined {
  return curriculum.find((ch) =>
    ch.lessons.some((l) => l.id === lessonId)
  );
}
