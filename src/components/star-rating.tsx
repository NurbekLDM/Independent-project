"use client";

type Props = {
  value: number | null;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
};

export function StarRating({ value, onChange, readonly = false, size = "sm" }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex gap-1 ${size === "md" ? "gap-1.5" : ""}`} role="radiogroup" aria-label="Reyting">
      {stars.map((star) => {
        const filled = value !== null && star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            aria-label={`${star} yulduz`}
            className={`transition ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } ${filled ? "text-amber-400" : "text-border"} ${
              !readonly ? "hover:text-amber-300" : ""
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={size === "md" ? "h-7 w-7" : "h-5 w-5"}
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
