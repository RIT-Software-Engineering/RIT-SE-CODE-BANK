import "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Theme {
        ritColors: {
            orange: string;
            white: string;
            black: string;
            gray_1: string;
            gray_2: string;
            gray_3: string;
            warm_gray_1: string;
            warm_gray_2: string;
            green: string;
            yellow_green: string;
            blue: string;
            purple: string;
            red: string;
        };
    }

    interface ThemeOptions {
        ritColors?: Theme["ritColors"];
    }
}

export {};