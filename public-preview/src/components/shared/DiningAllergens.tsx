import { AlertCircle } from 'lucide-react';
import type { AllergenType } from '@/types/demo';

export function DiningAllergens({ allergens }: { allergens: AllergenType[] }) {
  return (
                <>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Allergen Declaration</span>
              </h4>
              {allergens.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergens.map((alg, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[11px] font-bold text-rose-300"
                    >
                      Contains {alg}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400 font-semibold">
                  No common allergens declared in standard recipe.
                </p>
              )}
            </div>

            {/* Kitchen Cross-contamination note */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[10px] text-mist-400 leading-relaxed">
              <strong>Notice:</strong> Never assume a dish is 100% allergen-free. Cross-contamination may still occur in a busy hotel kitchen. Please specify any strict medical requirements in your order notes.
            </div>
    </>
  );
}
