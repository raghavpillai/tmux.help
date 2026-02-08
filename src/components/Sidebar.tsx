import { useState, useEffect } from 'react';
import { KeyCombo } from './KeyCombo';
import type { Chapter, Lesson, KeyCombo as KeyComboType } from '../lessons/curriculum';

interface SidebarProps {
  curriculum: Chapter[];
  currentLessonId: string;
  completedLessons: Set<string>;
  onLessonSelect: (lessonId: string) => void;
  hintIndex: number;
  onRequestHint: () => void;
}

export function Sidebar({
  curriculum,
  currentLessonId,
  completedLessons,
  onLessonSelect,
  hintIndex,
  onRequestHint,
}: SidebarProps) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const currentLesson = findLesson(curriculum, currentLessonId);
  const currentChapter = findChapterForLesson(curriculum, currentLessonId);

  useEffect(() => {
    if (currentChapter) {
      setExpandedChapter(currentChapter.id);
    }
  }, [currentChapter?.id]);

  const totalLessons = curriculum.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const progressPercent = (completedLessons.size / totalLessons) * 100;

  return (
    <div
      className="flex flex-col h-full select-none overflow-hidden"
      style={{
        background: '#0a0e14',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        fontFamily: "'Geist Mono', monospace",
      }}
    >
      {/* Header */}
      <div
        className="shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 28px 16px 20px',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-bold" style={{ color: '#41b65c' }}>
            tmux
          </span>
          <span className="text-[15px] font-bold" style={{ color: '#c5cdd8' }}>
            .help
          </span>
        </div>
        <p className="text-[11px] mb-4" style={{ color: '#565e6a' }}>
          Interactive tmux tutorial
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-[5px] rounded-full overflow-hidden"
            style={{ background: '#171d26' }}
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

      {/* Curriculum list */}
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
              {/* Chapter header */}
              <button
                className="w-full flex items-center gap-2 py-[9px] text-left text-[11px] transition-colors duration-100"
                style={{
                  color: chapterCompleted ? '#41b65c' : '#c5cdd8',
                  background: isExpanded ? '#111720' : 'transparent',
                  padding: '9px 28px 9px 20px',
                }}
                onClick={() =>
                  setExpandedChapter(isExpanded ? null : chapter.id)
                }
                onMouseEnter={(e) => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLElement).style.background = '#0e1219';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
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

              {/* Lessons */}
              {isExpanded && (
                <div className="py-0.5">
                  {chapter.lessons.map((lesson) => {
                    const isCompleted = completedLessons.has(lesson.id);
                    const isCurrent = lesson.id === currentLessonId;

                    return (
                      <button
                        key={lesson.id}
                        className="w-full flex items-center gap-2 text-left text-[11px] transition-colors duration-100"
                        style={{
                          color: isCompleted
                            ? '#41b65c'
                            : isCurrent
                            ? '#4e9af5'
                            : '#565e6a',
                          background: isCurrent
                            ? 'rgba(78,154,245,0.07)'
                            : 'transparent',
                          borderLeft: isCurrent
                            ? '2px solid #4e9af5'
                            : '2px solid transparent',
                          padding: '6px 28px 6px 36px',
                        }}
                        onClick={() => onLessonSelect(lesson.id)}
                        onMouseEnter={(e) => {
                          if (!isCurrent)
                            (e.currentTarget as HTMLElement).style.background =
                              '#0e1219';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent)
                            (e.currentTarget as HTMLElement).style.background =
                              isCurrent
                                ? 'rgba(78,154,245,0.07)'
                                : 'transparent';
                        }}
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

      {/* Current lesson detail panel */}
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

          {/* Objective */}
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

          {/* Key combos */}
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

          {/* Hints */}
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
                    className="text-[10px] mt-1 transition-colors duration-100"
                    style={{ color: '#565e6a' }}
                    onClick={onRequestHint}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = '#4e9af5')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = '#565e6a')
                    }
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
