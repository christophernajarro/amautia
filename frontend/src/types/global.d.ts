// Type overrides for base-ui components used via shadcn/ui v2
// These suppress strict typing issues with the Select, Dialog, and DropdownMenu components

import "@base-ui/react/select";
import "@base-ui/react/dialog";
import "@base-ui/react/menu";

declare module "@base-ui/react/select" {
  interface SelectRootProps {
    value?: string | undefined;
    onValueChange?: (value: any, ...args: any[]) => void;
    children?: React.ReactNode;
  }
}

declare module "@base-ui/react/dialog" {
  interface DialogRootProps {
    children?: React.ReactNode;
  }
  interface DialogTriggerProps {
    asChild?: boolean;
    children?: React.ReactNode;
  }
}

declare module "@base-ui/react/menu" {
  interface MenuRootProps {
    children?: React.ReactNode;
  }
  interface MenuTriggerProps {
    asChild?: boolean;
    children?: React.ReactNode;
  }
}
