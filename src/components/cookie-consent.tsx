"use client";

import { useState, useEffect, useRef } from "react";
import { X, Cookie, Settings, Shield, BarChart3 } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
}

const COOKIE_CONSENT_KEY = "randevuai-cookie-consent";

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
  timestamp: new Date().toISOString(),
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      if (!stored) {
        setIsVisible(true);
      } else {
        setPreferences(JSON.parse(stored));
      }
    }, 0);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);

    // Analytics çerezleri kabul edildiyse
    if (prefs.analytics) {
      // Google Analytics veya benzeri başlat
      const win = window as unknown as { gtag?: (...args: string[]) => void }
      if (typeof window !== 'undefined' && win.gtag) {
        win.gtag('consent', 'update', 'analytics_storage:granted')
      }
    }
  };

  const acceptAll = () => {
    savePreferences({
      ...defaultPreferences,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString(),
    });
  };

  const acceptNecessaryOnly = () => {
    savePreferences({
      ...defaultPreferences,
      timestamp: new Date().toISOString(),
    });
  };

  const saveCustomPreferences = () => {
    savePreferences({
      ...preferences,
      timestamp: new Date().toISOString(),
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {!showDetails ? (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Cookie className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Çerez Kullanımı
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Size daha iyi bir deneyim sunmak için çerezleri kullanıyoruz.
                  Zorunlu çerezler dışında, tercihlerinize göre çerez kullanımını
                  yönetebilirsiniz. Daha fazla bilgi için{" "}
                  <a href="/kvkk/aydinlatma" className="text-blue-600 hover:underline">
                    Aydınlatma Metni
                  </a>{" "}
                  ve{" "}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    Gizlilik Politikası
                  </a>{" "}
                  sayfalarımızı ziyaret edebilirsiniz.
                </p>
              </div>
              <button
                onClick={acceptNecessaryOnly}
                className="shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={acceptAll}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Tümünü Kabul Et
              </button>
              <button
                onClick={acceptNecessaryOnly}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Sadece Zorunlu
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Özelleştir
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Çerez Tercihleri
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Zorunlu Çerezler */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Zorunlu Çerezler</h4>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Zorunlu
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Sitenin düzgün çalışması için gerekli çerezler. Bunlar devre dışı bırakılamaz.
                  </p>
                </div>
              </div>

              {/* Analitik Çerezler */}
              <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <div className="p-2 bg-green-100 rounded-lg shrink-0">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Analitik Çerezler</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Sitemizi nasıl kullandığınızı anlamamıza yardımcı olan çerezler.
                  </p>
                </div>
              </div>

              {/* Pazarlama Çerezleri */}
              <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                  <Cookie className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Pazarlama Çerezleri</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Size özel kampanya ve duyurular göstermemizi sağlayan çerezler.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveCustomPreferences}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Tercihleri Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Çerez tercihlerini getir
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Çerez tercihlerini sıfırla
export function resetCookiePreferences() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.location.reload();
}
