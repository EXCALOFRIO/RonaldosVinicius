import AlcoholCalculator from "@/components/alcohol-calculator";
import ThemeToggle from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen p-0 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto">
        {/* --- MODIFIED HEADER --- */}
        {/*
         * Removed `flex-col md:flex-row` and replaced with just `flex-row`.
         * Removed `items-start md:items-center` and replaced with just `items-center` for consistent vertical alignment.
         * Kept `justify-between` to push items apart.
         * Kept `gap-4` for spacing when screen is small and items might wrap or get close.
         */}
        <header className="p-4 md:p-8 mb-4 md:mb-8 flex flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 shadow-md rounded-none md:rounded-xl">
          {/* This div groups the badge and title */}
          <div>
            <div className="inline-flex items-center px-3 py-1.5 mb-2 rounded-full bg-primary/15 text-primary text-base font-medium">
              Drógate seguro
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
              Calcula tus Ronaldos y Vinicius
            </h1>
            {/* Removed mb-2 from h1 as items-center on header will handle vertical alignment */}
          </div>
          {/* ThemeToggle remains as the second flex item */}
          <ThemeToggle />
        </header>
        {/* --- END OF MODIFIED HEADER --- */}

        <AlcoholCalculator />

        <footer className="mt-6 md:mt-16 p-4 md:p-6 text-center text-base md:text-lg text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6 md:pt-8">
          <p>
            Esta calculadora es solo para fines educativos y no debe utilizarse para determinar la aptitud para
            conducir.
          </p>
          <p className="mt-2">Bebe siempre sin responsabilidad alguna y conduce siempre después de consumir alcohol.</p>
        </footer>
      </div>
    </main>
  );
}