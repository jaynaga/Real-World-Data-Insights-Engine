import { BackgroundColorValue, ColorValue, DesignToken } from '../types/designToken';
import { StateTokens } from './button';
interface SearchTokens {
    color: DesignToken<ColorValue>;
    backgroundColor: DesignToken<BackgroundColorValue>;
    _active: StateTokens;
    _disabled: StateTokens;
    _focus: StateTokens;
    _hover: StateTokens;
}
export interface SearchFieldTokens {
    color: DesignToken<ColorValue>;
    button: SearchTokens;
}
export declare const searchfield: SearchFieldTokens;
export {};
