import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Eraser } from 'lucide-react';

interface SignaturePadProps {
  title: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ title, onSave, onClose, isDarkMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a';
      }
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    }
  };

  const handleSave = () => {
      if (canvasRef.current) {
          onSave(canvasRef.current.toDataURL('image/png'));
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className={`w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className={`flex justify-between items-center border-b pb-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className="font-black text-lg">{title}</h3>
            <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}><X size={18} /></button>
        </div>
        
        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white h-48 relative touch-none overflow-hidden shadow-inner">
            <canvas 
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            {!hasDrawn && <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none font-bold text-xl select-none">وقع هنا</div>}
        </div>

        <div className="flex gap-2">
            <button onClick={clear} className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                <Eraser size={18} /> مسح
            </button>
            <button onClick={handleSave} className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                <Check size={18} /> حفظ التوقيع
            </button>
        </div>
      </div>
    </div>
  );
};
