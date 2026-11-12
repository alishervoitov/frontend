import { lazy } from "react";

const KEY = "chunk-reload";

// Sahifa kodi alohida bo'lak (chunk) sifatida faqat kerak bo'lganda yuklanadi.
// Yangi versiya o'rnatilgach ochiq turgan eski oynada bo'lak nomi eskirgan bo'ladi (serverda 404):
// bunda sahifa bir marta yangilanadi; yana yuklanmasa xato ErrorBoundary'ga chiqadi.
export default function lazyPage(load) {
    return lazy(() =>
        load().then(
            (mod) => {
                try { sessionStorage.removeItem(KEY); } catch { /* xotira yopiq */ }
                return mod;
            },
            (err) => {
                let tried = true;
                try {
                    tried = sessionStorage.getItem(KEY) === "1";
                    sessionStorage.setItem(KEY, "1");
                } catch { /* xotira yopiq: qayta yuklamaymiz, aks holda cheksiz aylanadi */ }
                if (tried) throw err;
                window.location.reload();
                return new Promise(() => {});
            },
        ),
    );
}
