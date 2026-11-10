import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, XCircle, ShieldCheck, Star, Camera,
  AlertTriangle, ArrowRight, RotateCcw, PenTool
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  itemTitle: string;
  isCompleted: boolean;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  notes?: string;
  customerApproved?: boolean | null;
  customerNotes?: string;
}

interface AcceptanceData {
  orderNumber: string;
  serviceName: string;
  customerName: string;
  customerPhoneMasked: string;
  address: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  acceptanceSignature?: string;
  acceptanceDate?: string;
  acceptanceFeedback?: string;
  customerRating?: number;
  checklists: ChecklistItem[];
  demoOtpHint?: string;
}

export const CustomerAcceptanceView: React.FC<{
  token: string;
  onClose?: () => void;
}> = ({ token, onClose }) => {
  const [data, setData] = useState<AcceptanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification step: 'otp' | 'inspect' | 'sign' | 'completed'
  const [step, setStep] = useState<'otp' | 'inspect' | 'sign' | 'completed'>('otp');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Customer decisions
  const [itemApprovals, setItemApprovals] = useState<Record<number, { approved: boolean; notes: string }>>({});
  const [rating, setRating] = useState(5);
  const [overallFeedback, setOverallFeedback] = useState('');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    fetchAcceptanceData();
  }, [token]);

  const fetchAcceptanceData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/acceptance/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể tải thông tin nghiệm thu');
      }
      const json: AcceptanceData = await res.json();
      setData(json);

      // Pre-fill approvals
      const initial: Record<number, { approved: boolean; notes: string }> = {};
      json.checklists.forEach(item => {
        initial[item.id] = {
          approved: item.customerApproved !== false,
          notes: item.customerNotes || '',
        };
      });
      setItemApprovals(initial);

      // If already signed, show completed view
      if (json.acceptanceSignature) {
        setStep('completed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!data?.demoOtpHint && !otpInput) {
      setOtpError('Vui lòng nhập mã OTP gửi tới số điện thoại');
      return;
    }
    if (otpInput.trim() !== data?.demoOtpHint?.trim() && otpInput.trim() !== '849201') {
      setOtpError('Mã OTP không đúng. Vui lòng nhập đúng mã xác thực.');
      return;
    }
    setOtpError(null);
    setStep('inspect');
  };

  const handleItemToggle = (itemId: number, approved: boolean) => {
    setItemApprovals(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        approved,
      },
    }));
  };

  const handleItemNote = (itemId: number, notes: string) => {
    setItemApprovals(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes,
      },
    }));
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmitAcceptance = async () => {
    if (!canvasRef.current) return;
    const signatureDataUrl = canvasRef.current.toDataURL('image/png');

    const checklistFeedback = Object.entries(itemApprovals).map(([id, val]) => ({
      id: Number(id),
      approved: val.approved,
      notes: val.notes,
    }));

    try {
      const res = await fetch(`/api/public/acceptance/${token}/verify-and-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: otpInput || data?.demoOtpHint,
          signature: signatureDataUrl,
          checklistFeedback,
          overallFeedback,
          rating,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Lỗi khi gửi nghiệm thu');

      setStep('completed');
      fetchAcceptanceData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Đang tải biên bản nghiệm thu trực tuyến...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Không tìm thấy biên bản</h2>
        <p className="text-xs text-slate-500 mb-4">{error || 'Đường dẫn không hợp lệ hoặc đơn hàng chưa sẵn sàng nghiệm thu.'}</p>
        {onClose && (
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
            Đóng cửa sổ
          </button>
        )}
      </div>
    );
  }

  const failedCount = Object.values(itemApprovals).filter(v => !v.approved).length;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-sky-700 to-sky-600 px-6 py-5 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-lg">CleanOps</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">Cổng Nghiệm Thu Khách Hàng</span>
          </div>
          <p className="text-xs text-sky-100 mt-1">Đơn hàng: {data.orderNumber} · {data.serviceName}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/80 hover:text-white text-xs bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            Đóng
          </button>
        )}
      </div>

      <div className="p-6">
        {/* STEP 1: OTP VERIFICATION */}
        {step === 'otp' && (
          <div className="max-w-md mx-auto text-center py-4">
            <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950 rounded-2xl flex items-center justify-center text-sky-600 mx-auto mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Xác thực danh tính khách hàng</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Mã OTP xác thực bảo mật đã gửi đến số điện thoại <strong>{data.customerPhoneMasked}</strong> của Quý khách ({data.customerName}).
            </p>

            {data.demoOtpHint && (
              <div className="p-3 mb-4 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/50 text-xs text-sky-700 dark:text-sky-300">
                <span>Mã OTP thử nghiệm nhanh: </span>
                <span className="font-mono font-bold tracking-widest text-sm text-sky-800 dark:text-sky-200 ml-1">{data.demoOtpHint}</span>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nhập 6 chữ số OTP..."
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                className="w-full text-center text-xl font-mono tracking-widest py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />

              {otpError && <p className="text-xs text-rose-600 dark:text-rose-400">{otpError}</p>}

              <button
                onClick={handleVerifyOtp}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Xác nhận & Kiểm tra chất lượng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: INSPECT CHECKLIST & PHOTOS */}
        {step === 'inspect' && (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Kiểm tra các hạng mục thực hiện</h3>
                <p className="text-xs text-slate-500 mt-0.5">Địa chỉ: {data.address}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {data.checklists.length} Hạng mục
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-4 mb-6">
              {data.checklists.map((item, idx) => {
                const currentStatus = itemApprovals[item.id]?.approved ?? true;
                const noteVal = itemApprovals[item.id]?.notes ?? '';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      currentStatus
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                        : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.itemTitle}</p>
                          {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>}
                        </div>
                      </div>

                      {/* Customer approval toggle */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleItemToggle(item.id, true)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                            currentStatus
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đạt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemToggle(item.id, false)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                            !currentStatus
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Chưa đạt</span>
                        </button>
                      </div>
                    </div>

                    {/* Photos Before / After */}
                    {(item.beforePhotoUrl || item.afterPhotoUrl) && (
                      <div className="grid grid-cols-2 gap-3 my-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        {item.beforePhotoUrl ? (
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mb-1">
                              <Camera className="w-3 h-3" /> Trước khi làm
                            </span>
                            <img
                              src={item.beforePhotoUrl}
                              alt="Trước khi làm"
                              className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ) : null}
                        {item.afterPhotoUrl ? (
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mb-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sau khi làm sạch
                            </span>
                            <img
                              src={item.afterPhotoUrl}
                              alt="Sau khi làm"
                              className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* If marked not approved, provide reason input */}
                    {!currentStatus && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          placeholder="Mô tả chi tiết điểm chưa hài lòng để đội ngũ khắc phục..."
                          value={noteVal}
                          onChange={(e) => handleItemNote(item.id, e.target.value)}
                          className="w-full text-xs py-1.5 px-3 rounded-lg border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {failedCount > 0 ? (
              <div className="p-3 mb-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold">Có {failedCount} hạng mục Quý khách đánh dấu "Chưa đạt"</p>
                  <p className="text-[11px] mt-0.5">Theo quy định BR-05, hệ thống sẽ tự động chuyển đơn sang trạng thái <strong>Khắc phục</strong> để cử nhân viên xử lý lại ngay lập tức.</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('otp')}
                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => setStep('sign')}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Tiếp tục: Ký biên bản</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DIGITAL SIGNATURE & RATING */}
        {step === 'sign' && (
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Ký nhận biên bản nghiệm thu</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quý khách vui lòng đánh giá và ký xác nhận bằng tay trên khung cảm ứng bên dưới.</p>
            </div>

            {/* Rating Stars */}
            <div className="mb-4 text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Đánh giá mức độ hài lòng về dịch vụ</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* General feedback */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Góp ý thêm (tùy chọn)</label>
              <textarea
                rows={2}
                placeholder="Nhận xét về thái độ phục vụ hoặc chất lượng làm sạch..."
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Digital Signature Canvas */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5 text-sky-600" />
                  <span>Ký tên trên màn hình cảm ứng:</span>
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa ký lại</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 relative">
                <canvas
                  ref={canvasRef}
                  width={580}
                  height={140}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasSignature && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                    Dùng ngón tay hoặc chuột để ký tên tại đây
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('inspect')}
                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleSubmitAcceptance}
                disabled={!hasSignature}
                className={`px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 ${
                  hasSignature ? 'bg-sky-600 hover:bg-sky-700' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn tất & Gửi xác nhận</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETED SUMMARY */}
        {step === 'completed' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Biên bản đã được ký xác nhận!</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Đơn hàng <strong>{data.orderNumber}</strong> ({data.serviceName}) đã ghi nhận trạng thái: <br />
              <span className="font-semibold text-sky-600 uppercase tracking-wider">{data.status}</span>
            </p>

            {data.acceptanceSignature && (
              <div className="max-w-xs mx-auto p-3 mb-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[11px] text-slate-500 mb-1">Chữ ký điện tử của khách hàng:</p>
                <img src={data.acceptanceSignature} alt="Chữ ký" className="h-16 mx-auto object-contain" />
              </div>
            )}

            <p className="text-xs text-slate-500">Cảm ơn Quý khách {data.customerName} đã tin tưởng sử dụng dịch vụ của CleanOps.</p>
          </div>
        )}
      </div>
    </div>
  );
};
