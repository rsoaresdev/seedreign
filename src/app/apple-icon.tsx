import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 30% 20%, #1a2338 0%, #0a0e16 65%)",
      }}
    >
      <div
        style={{
          width: 104,
          height: 128,
          background: "#f6b73c",
          borderRadius: "50% 50% 46% 46% / 60% 60% 40% 40%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 52,
            background: "#0a0e16",
            borderRadius: "50% 50% 46% 46% / 60% 60% 40% 40%",
          }}
        />
      </div>
    </div>,
    size
  );
}
