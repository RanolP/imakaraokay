import { ParentProps, Suspense } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useTranslation, LanguageSwitcher } from './features/i18n';

function App(props: ParentProps) {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <>
      <nav class="bg-gray-200 text-gray-900 px-4">
        <ul class="flex items-center">
          <li class="py-2 px-4">
            <A href="/" class="hover:text-purple-300 transition-colors">
              {t('nav.home')}
            </A>
          </li>
          <li class="py-2 px-4">
            <A href="/about" class="hover:text-purple-300 transition-colors">
              {t('nav.about')}
            </A>
          </li>
          <li class="py-2 px-4">
            <A href="/error" class="hover:text-purple-300 transition-colors">
              {t('nav.error')}
            </A>
          </li>

          <li class="flex items-center space-x-4 ml-auto">
            <LanguageSwitcher />
            <div class="text-sm flex items-center space-x-1">
              <span>URL:</span>
              <input
                class="w-75px p-1 bg-white text-sm rounded-lg"
                type="text"
                readOnly
                value={location.pathname}
              />
            </div>
          </li>
        </ul>
      </nav>

      <main>
        <Suspense>{props.children}</Suspense>
      </main>
    </>
  );
};

export default App;
