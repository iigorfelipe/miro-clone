"use client";

import { colorToCss } from "@/lib/utils";
import { Color } from "@/types/canvas";

interface ColorPickerProps {
  onChange: (color: Color) => void;
};

const COLORS = [
  { r: 243, g: 82, b: 35 },
  { r: 255, g: 249, b: 177 },
  { r: 68, g: 202, b: 99 },
  { r: 39, g: 142, b: 237 },
  { r: 155, g: 105, b: 245 },
  { r: 255, g: 142, b: 42 },
  { r: 0, g: 0, b: 0 },
  { r: 255, g: 255, b: 255 },
]

export const ColorPicker = ({
  onChange
}: ColorPickerProps) => {
  return (
    <div
      className="flex flex-wrap gap-2 items-center max-w-[164px] pr-2 mr-2 border-r border-neutral-200"
    >
      {
        COLORS.map((color) => (
          <ColorButton
            key={`r: ${color.r}, g: ${color.g}, b: ${color.b}`}
            color={color}
            onClick={onChange}
          />
        ))
      }

    </div>
  )
};

interface ColorButtonProps {
  onClick: (color: Color) => void;
  color: Color;
};

const ColorButton = ({
  color,
  onClick
}: ColorButtonProps) => {
  return (
    <button
      className="w-8 h-8 items-center flex justify-center hover:opacity-75 transition"
      onClick={() => onClick(color)}
    >
      <div
        className="h-8 w-8 rounded-md border border-neutral-300"
        style={{ background: colorToCss(color) }}
      />    
    </button>
  )
};
