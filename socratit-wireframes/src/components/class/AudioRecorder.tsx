// ============================================================================
// AUDIO RECORDER COMPONENT
// Records audio, allows labeling, and creates lesson with AI-generated notes
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Upload, Loader } from 'lucide-react';
import { lessonService } from '../../services/lesson.service';

interface AudioRecorderProps {
  classId: string;
  onLessonCreated: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ classId, onLessonCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob || !title.trim()) {
      setError('Please provide a title for the lesson');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const audioFile = new File([audioBlob], 'lesson-recording.webm', {
        type: 'audio/webm',
      });

      await lessonService.createLesson(classId, {
        title: title.trim(),
        lessonDate: new Date().toISOString(),
        audioFile,
        durationSeconds: recordingTime,
      });

      // Reset state
      setAudioBlob(null);
      setTitle('');
      setRecordingTime(0);
      onLessonCreated();
    } catch (err: any) {
      console.error('Error creating lesson:', err);
      setError(err.response?.data?.message || 'Failed to create lesson. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setAudioBlob(null);
    setTitle('');
    setRecordingTime(0);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-4">Record Lesson Notes</h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!audioBlob ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </motion.button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-2xl font-mono font-bold text-gray-900">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <Square className="w-5 h-5" />
                  Stop Recording
                </motion.button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Record your class session and we'll automatically generate notes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Recording Complete</span>
              <span className="text-sm text-green-600">{formatTime(recordingTime)}</span>
            </div>
          </div>

          <div>
            <label htmlFor="lesson-title" className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Title *
            </label>
            <input
              id="lesson-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Quadratic Equations"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!title.trim() || isUploading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating Notes...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Generate Lesson Notes
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              disabled={isUploading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
