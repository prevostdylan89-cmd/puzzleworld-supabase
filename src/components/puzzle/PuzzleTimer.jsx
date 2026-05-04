import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PuzzleTimer({ puzzleId, puzzleName, user }) {
  const [timers, setTimers] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user && puzzleId) {
      loadTimers();
    }
  }, [user, puzzleId]);

  useEffect(() => {
    let interval;
    if (isRunning && activeTimer) {
      interval = setInterval(() => {
        const startTime = activeTimer.paused_at 
          ? new Date(activeTimer.paused_at).getTime()
          : new Date(activeTimer.start_time).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000) + activeTimer.accumulated_seconds;
        setCurrentTime(elapsed);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTimer]);

  const loadTimers = async () => {
    try {
      const allTimers = await base44.entities.PuzzleTimer.filter({
        puzzle_id: puzzleId,
        created_by: user.email
      });
      
      const active = allTimers.find(t => t.is_active);
      if (active) {
        setActiveTimer(active);
        setIsRunning(!active.paused_at);
        if (active.paused_at) {
          setCurrentTime(active.accumulated_seconds);
        }
      }
      
      setTimers(allTimers.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)));
    } catch (error) {
      console.error('Error loading timers:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    try {
      const newTimer = await base44.entities.PuzzleTimer.create({
        puzzle_id: puzzleId,
        puzzle_name: puzzleName,
        start_time: new Date().toISOString(),
        is_active: true,
        accumulated_seconds: 0
      });
      
      setActiveTimer(newTimer);
      setIsRunning(true);
      setCurrentTime(0);
      toast.success('Chronomètre démarré');
      loadTimers();
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Erreur lors du démarrage');
    }
  };

  const pauseTimer = async () => {
    if (!activeTimer) return;
    
    try {
      await base44.entities.PuzzleTimer.update(activeTimer.id, {
        paused_at: new Date().toISOString(),
        accumulated_seconds: currentTime
      });
      
      setIsRunning(false);
      toast.success('Chronomètre en pause');
      loadTimers();
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Erreur lors de la pause');
    }
  };

  const resumeTimer = async () => {
    if (!activeTimer) return;
    
    try {
      await base44.entities.PuzzleTimer.update(activeTimer.id, {
        paused_at: null,
        start_time: new Date().toISOString()
      });
      
      setIsRunning(true);
      toast.success('Chronomètre repris');
      loadTimers();
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast.error('Erreur lors de la reprise');
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      await base44.entities.PuzzleTimer.update(activeTimer.id, {
        end_time: new Date().toISOString(),
        total_seconds: currentTime,
        is_active: false
      });
      
      setActiveTimer(null);
      setIsRunning(false);
      setCurrentTime(0);
      toast.success('Tentative terminée');
      loadTimers();
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Erreur lors de l\'arrêt');
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const bestTime = timers
    .filter(t => t.total_seconds && !t.is_active)
    .sort((a, b) => a.total_seconds - b.total_seconds)[0];

  if (!user) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
        <Clock className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-white/50 text-sm">Connectez-vous pour chronométrer</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400" />
          Chronomètre
        </h3>
        {timers.length > 0 && (
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
                Historique ({timers.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a2e] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Historique des tentatives</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timers.filter(t => !t.is_active && t.total_seconds).map((timer, index) => (
                  <div key={timer.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">
                        Tentative #{timers.filter(t => !t.is_active && t.total_seconds).length - index}
                      </span>
                      <span className="text-orange-400 font-mono font-bold">
                        {formatTime(timer.total_seconds)}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs mt-1">
                      {new Date(timer.start_time).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {bestTime && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="text-green-400 text-xs mb-1">Meilleur temps</div>
          <div className="text-white font-mono text-2xl font-bold">
            {formatTime(bestTime.total_seconds)}
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-lg p-4 text-center">
        <div className="text-white font-mono text-4xl font-bold mb-4">
          {formatTime(currentTime)}
        </div>
        
        <div className="flex gap-2 justify-center">
          {!activeTimer ? (
            <Button onClick={startTimer} className="bg-green-500 hover:bg-green-600 text-white">
              <Play className="w-4 h-4 mr-2" />
              Démarrer
            </Button>
          ) : (
            <>
              {isRunning ? (
                <Button onClick={pauseTimer} variant="outline" className="border-white/20 text-white">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={resumeTimer} className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Reprendre
                </Button>
              )}
              <Button onClick={stopTimer} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Terminer
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}