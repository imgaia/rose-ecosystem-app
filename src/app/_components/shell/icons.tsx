// src/app/_components/shell/icons.tsx
// The line icons from the ROSE App Wireframes, as small React components.
// They draw in the current text colour, so a parent's `text-…` class colours them.

type IconProps = { size?: number; strokeWidth?: number };

function Icon({ size = 22, strokeWidth = 1.8, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
  </Icon>
);

export const RelationshipsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M8.6 10.7 15.4 7.3" />
    <path d="M8.6 13.3l6.8 3.4" />
  </Icon>
);

export const WalletIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <path d="M16 14.5h2" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronUpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h13" />
    <path d="m13 7 5 5-5 5" />
  </Icon>
);

export const RequestIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12H7" />
    <path d="m11 7-5 5 5 5" />
  </Icon>
);

export const WorkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h5l3-3 3 3h5" />
    <path d="M9 12l3 3 3-3" />
  </Icon>
);

export const ExchangeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 8h13" />
    <path d="m14 4 4 4-4 4" />
    <path d="M19 16H6" />
    <path d="m10 12-4 4 4 4" />
  </Icon>
);

export const InviteIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3.5 19c.8-3.5 3.4-5 6.5-5s5.7 1.5 6.5 5" />
    <path d="M19 7v6" />
    <path d="M16 10h6" />
  </Icon>
);
