// mask-utils.ts - 蒙板工具函数
// 此文件包含蒙板相关的工具函数和辅助方法
// 文件路径: lib/mask-utils.ts
// 最后更新: 2025/1/8

import { MaskConfig, MaskType, MaskShape, MaskBlendMode } from "@/types/timeline";
import { generateUUID } from "@/lib/utils";

// 默认蒙板配置
export const DEFAULT_MASK_CONFIG: Omit<MaskConfig, "id"> = {
  type: "rectangle" as MaskType,
  shape: "rectangle" as MaskShape,
  x: 0, // 画布中心
  y: 0, // 画布中心
  width: 0.5, // 50% 画布宽度
  height: 0.5, // 50% 画布高度
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  feather: 0,
  invert: false,
  blendMode: "normal" as MaskBlendMode,
};

// 创建新蒙板
export function createMask(type: MaskType, shape: MaskShape): MaskConfig {
  return {
    id: generateUUID(),
    ...DEFAULT_MASK_CONFIG,
    type,
    shape,
  };
}

// 创建矩形蒙板
export function createRectangleMask(): MaskConfig {
  return createMask("rectangle", "rectangle");
}

// 创建圆形蒙板
export function createCircleMask(): MaskConfig {
  return {
    ...createMask("circle", "circle"),
    width: 0.3, // 圆形默认较小
    height: 0.3,
  };
}

// 蒙板预设模板
export const MASK_TEMPLATES = [
  {
    id: "rectangle-center",
    name: "矩形蒙板",
    description: "居中矩形蒙板",
    icon: "⬜",
    config: createRectangleMask(),
  },
  {
    id: "circle-center",
    name: "圆形蒙板",
    description: "居中圆形蒙板",
    icon: "⭕",
    config: createCircleMask(),
  },
  {
    id: "rectangle-top",
    name: "顶部矩形",
    description: "顶部矩形蒙板",
    icon: "⬜",
    config: {
      ...createRectangleMask(),
      y: -0.25,
      height: 0.3,
    },
  },
  {
    id: "rectangle-bottom",
    name: "底部矩形",
    description: "底部矩形蒙板",
    icon: "⬜",
    config: {
      ...createRectangleMask(),
      y: 0.25,
      height: 0.3,
    },
  },
] as const;

// 🔧 修复：蒙版坐标转换工具 - 确保精确的坐标系统同步
export class MaskCoordinateUtils {
  // 将相对坐标转换为画布像素坐标（中心点）
  static relativeToPixels(
    relativeX: number,
    relativeY: number,
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number } {
    // 相对坐标系：-1 到 1，中心点为 (0, 0)
    // 像素坐标系：0 到 canvasWidth/Height，中心点为 (canvasWidth/2, canvasHeight/2)
    return {
      x: (relativeX + 1) * canvasWidth / 2,
      y: (relativeY + 1) * canvasHeight / 2,
    };
  }

  // 将画布像素坐标转换为相对坐标
  static pixelsToRelative(
    pixelX: number,
    pixelY: number,
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number } {
    return {
      x: (pixelX / canvasWidth) * 2 - 1,
      y: (pixelY / canvasHeight) * 2 - 1,
    };
  }

  // 将相对尺寸转换为画布像素尺寸
  static relativeSizeToPixels(
    relativeWidth: number,
    relativeHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): { width: number; height: number } {
    return {
      width: Math.abs(relativeWidth * canvasWidth),
      height: Math.abs(relativeHeight * canvasHeight),
    };
  }

  // 将画布像素尺寸转换为相对尺寸
  static pixelSizeToRelative(
    pixelWidth: number,
    pixelHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): { width: number; height: number } {
    return {
      width: pixelWidth / canvasWidth,
      height: pixelHeight / canvasHeight,
    };
  }

  // 🔧 新增：计算蒙版的边界框（用于控制框定位）
  static getMaskBounds(
    mask: MaskConfig,
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number; width: number; height: number } {
    const { x: centerX, y: centerY } = this.relativeToPixels(
      mask.x,
      mask.y,
      canvasWidth,
      canvasHeight
    );
    const { width, height } = this.relativeSizeToPixels(
      mask.width,
      mask.height,
      canvasWidth,
      canvasHeight
    );

    return {
      x: centerX - width / 2,  // 左上角 x
      y: centerY - height / 2, // 左上角 y
      width,
      height,
    };
  }

  // 🔧 新增：验证坐标是否在有效范围内
  static clampRelativeCoordinates(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }

  // 🔧 新增：验证尺寸是否在有效范围内
  static clampRelativeSize(width: number, height: number): { width: number; height: number } {
    return {
      width: Math.max(0.01, Math.min(2, width)),   // 最小1%，最大200%
      height: Math.max(0.01, Math.min(2, height)),
    };
  }
}

// 蒙板验证工具
export class MaskValidator {
  // 验证蒙板配置
  static validateMaskConfig(mask: MaskConfig): boolean {
    // 检查必需字段
    if (!mask.id || !mask.type || !mask.shape) {
      return false;
    }

    // 检查数值范围
    if (
      mask.opacity < 0 || mask.opacity > 1 ||
      mask.feather < 0 || mask.feather > 100 ||
      mask.scaleX < 0 || mask.scaleX > 2 ||
      mask.scaleY < 0 || mask.scaleY > 2
    ) {
      return false;
    }

    return true;
  }

  // 检查蒙板是否在画布范围内
  static isMaskInBounds(mask: MaskConfig): boolean {
    const left = mask.x - mask.width / 2;
    const right = mask.x + mask.width / 2;
    const top = mask.y - mask.height / 2;
    const bottom = mask.y + mask.height / 2;

    return left >= -1 && right <= 1 && top >= -1 && bottom <= 1;
  }
}

// 蒙板渲染工具
export class MaskRenderer {
  // 生成CSS蒙板样式
  static generateCSSMask(mask: MaskConfig, canvasWidth: number, canvasHeight: number): string {
    // 将相对坐标转换为百分比
    const centerX = (mask.x + 1) * 50; // -1到1 转换为 0到100
    const centerY = (mask.y + 1) * 50;
    const width = mask.width * 100;
    const height = mask.height * 100;

    switch (mask.shape) {
      case "rectangle":
        // 计算矩形的四个角的百分比坐标
        const left = centerX - width / 2;
        const right = centerX + width / 2;
        const top = centerY - height / 2;
        const bottom = centerY + height / 2;
        return `polygon(${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%)`;

      case "circle":
        // 使用较小的尺寸作为半径
        const radius = Math.min(width, height) / 2;
        return `circle(${radius}% at ${centerX}% ${centerY}%)`;

      default:
        return "none";
    }
  }

  // 生成Canvas路径
  static generateCanvasPath(
    ctx: CanvasRenderingContext2D,
    mask: MaskConfig,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const { x, y } = MaskCoordinateUtils.relativeToPixels(
      mask.x,
      mask.y,
      canvasWidth,
      canvasHeight
    );
    const { width: pixelWidth, height: pixelHeight } = MaskCoordinateUtils.relativeSizeToPixels(
      mask.width,
      mask.height,
      canvasWidth,
      canvasHeight
    );

    ctx.save();
    ctx.translate(x + pixelWidth / 2, y + pixelHeight / 2);
    ctx.rotate((mask.rotation * Math.PI) / 180);
    ctx.scale(mask.scaleX, mask.scaleY);

    switch (mask.shape) {
      case "rectangle":
        ctx.rect(-pixelWidth / 2, -pixelHeight / 2, pixelWidth, pixelHeight);
        break;
      
      case "circle":
        const radius = Math.min(pixelWidth, pixelHeight) / 2;
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        break;
    }

    ctx.restore();
  }
}

// 蒙板动画工具 (未来扩展)
export class MaskAnimator {
  // 插值计算两个蒙板配置之间的中间状态
  static interpolate(
    maskA: MaskConfig,
    maskB: MaskConfig,
    progress: number
  ): MaskConfig {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    return {
      ...maskA,
      x: lerp(maskA.x, maskB.x, progress),
      y: lerp(maskA.y, maskB.y, progress),
      width: lerp(maskA.width, maskB.width, progress),
      height: lerp(maskA.height, maskB.height, progress),
      rotation: lerp(maskA.rotation, maskB.rotation, progress),
      scaleX: lerp(maskA.scaleX, maskB.scaleX, progress),
      scaleY: lerp(maskA.scaleY, maskB.scaleY, progress),
      opacity: lerp(maskA.opacity, maskB.opacity, progress),
      feather: lerp(maskA.feather, maskB.feather, progress),
    };
  }
}
