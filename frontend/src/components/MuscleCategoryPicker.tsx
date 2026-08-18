import { BottomSheet } from "./BottomSheet";

const MUSCLE_DATA = [
  { name: "chest", label: "Chest", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3294-A9qxk2F.gif" },
  { name: "back", label: "Back", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0007-4IKbhHV.gif" },
  { name: "shoulders", label: "Shoulders", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0977-sTg7iys.gif" },
  { name: "quads", label: "Quads", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1512-qBcKorM.gif" },
  { name: "hamstrings", label: "Hamstrings", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0016-VedGSby.gif" },
  { name: "glutes", label: "Glutes", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3214-RtyAsy1.gif" },
  { name: "biceps", label: "Biceps", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0968-3omWx6P.gif" },
  { name: "triceps", label: "Triceps", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0018-7HcfMBP.gif" },
  { name: "abs", label: "Abs", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0001-2gPfomN.gif" },
  { name: "calves", label: "Calves", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1368-uL9CsKm.gif" },
  { name: "forearms", label: "Forearms", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0994-Ezpnw9d.gif" },
  { name: "traps", label: "Traps", image: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1018-trmte8s.gif" },
];

type MuscleCategoryPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (muscle: string) => void;
};

export function MuscleCategoryPicker({ open, onClose, onSelect }: MuscleCategoryPickerProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Which muscle did you train?">
      <div className="grid grid-cols-3 gap-3">
        {MUSCLE_DATA.map((m) => (
          <button
            key={m.name}
            onClick={() => {
              onSelect(m.name);
              onClose();
            }}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-black/[0.08] bg-black/[0.03] p-2 backdrop-blur-2xl transition-all duration-300 hover:bg-black/[0.08] hover:border-black/[0.12] active:scale-95 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:hover:border-white/[0.12]"
          >
            <div className="h-16 w-16 overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.04] dark:border-white/[0.08] dark:bg-white/[0.04]">
              <img
                src={m.image}
                alt={m.label}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-[13px] font-bold capitalize text-black transition-colors group-hover:text-black dark:text-ivory dark:group-hover:text-white">
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
