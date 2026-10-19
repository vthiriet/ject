import {
  ArchiveIcon, ArrowCounterClockwiseIcon, ArrowLeftIcon, ArrowsClockwiseIcon, BookmarkSimpleIcon, BoxArrowUpIcon, CardsIcon, CaretDownIcon, CaretRightIcon,
  CheckIcon, CheckCircleIcon, CheckSquareIcon, CloudIcon, CopyIcon, DotsSixVerticalIcon, DotsThreeVerticalIcon, DownloadSimpleIcon, FlagIcon, FlameIcon,
  FolderSimpleIcon, FunnelSimpleIcon, GearSixIcon, HourglassIcon, ImageIcon, ListChecksIcon, ListIcon, MagnifyingGlassIcon, MoonIcon, PaletteIcon, PaperPlaneTiltIcon, PencilSimpleIcon, PlusIcon,
  PushPinIcon, RowsIcon, ShareNetworkIcon, SignOutIcon, SquareIcon, SquaresFourIcon, StarIcon, TagIcon, TrashIcon, TrayArrowDownIcon, UploadSimpleIcon, XIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

/** Icônes de l'interface (bibliothèque Phosphor) : au trait par défaut, pleines quand actives. */
const ICONS = {
  menu: ListIcon,
  search: MagnifyingGlassIcon,
  close: XIcon,
  grid: SquaresFourIcon,
  list: RowsIcon,
  listcheck: ListChecksIcon,
  pin: PushPinIcon,
  archive: ArchiveIcon,
  unarchive: BoxArrowUpIcon,
  trash: TrashIcon,
  restore: ArrowCounterClockwiseIcon,
  palette: PaletteIcon,
  label: TagIcon,
  more: DotsThreeVerticalIcon,
  checked: CheckSquareIcon,
  unchecked: SquareIcon,
  settings: GearSixIcon,
  inbox: TrayArrowDownIcon,
  back: ArrowLeftIcon,
  add: PlusIcon,
  edit: PencilSimpleIcon,
  share: ShareNetworkIcon,
  copy: CopyIcon,
  cloud: CloudIcon,
  image: ImageIcon,
  send: PaperPlaneTiltIcon,
  drag: DotsSixVerticalIcon,
  expand: CaretDownIcon,
  notes: CardsIcon,
  download: DownloadSimpleIcon,
  upload: UploadSimpleIcon,
  logout: SignOutIcon,
  check: CheckIcon,
  file: FolderSimpleIcon,
  funnel: FunnelSimpleIcon,
  next: CaretRightIcon,
  task: CheckCircleIcon,
  repeat: StarIcon,
  flag: FlagIcon,
  bookmark: BookmarkSimpleIcon,
  hourglass: HourglassIcon,
  moon: MoonIcon,
  flame: FlameIcon,
  sync: ArrowsClockwiseIcon,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

/** Toujours pleines : leur forme pleine porte l'information (case cochée). */
const FILLED: IconName[] = ['checked'];

export function Icon({ name, size = 24, fill }: { name: IconName; size?: number; fill?: boolean }) {
  const Svg = ICONS[name];
  return <Svg size={size} weight={fill || FILLED.includes(name) ? 'fill' : 'regular'} aria-hidden="true" />;
}

/** Bouton rond contenant une icône, avec une étiquette pour l'accessibilité. */
export function IconButton({
  name, label, onClick, active, size, className = '',
}: { name: IconName; label: string; onClick?: (e: React.MouseEvent) => void; active?: boolean; size?: number; className?: string }) {
  return (
    <button type="button" className={`icon-btn ${active ? 'active' : ''} ${className}`} title={label} aria-label={label} onClick={onClick}>
      <Icon name={name} size={size} fill={active} />
    </button>
  );
}

/** Case à cocher de la charte (décisions 18, 19, 34) : 18 px, corail + coche foncée quand cochée. */
export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span className={`case ${checked ? 'on' : ''}`} aria-hidden="true">
      {checked && <CheckIcon size={12} weight="bold" />}
    </span>
  );
}
