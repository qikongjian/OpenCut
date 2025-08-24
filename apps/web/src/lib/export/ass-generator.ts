// ass-generator.ts - ASS字幕格式生成器
// 此文件负责将时间轴文本元素转换为ASS字幕格式
// 文件路径: lib/export/ass-generator.ts

import { TimelineIR } from "@/types/timeline";
import { ASSFile, ASSStyle, ASSDialogue } from "@/types/export";

/**
 * ASS字幕生成器
 */
export class ASSGenerator {
  /**
   * 从TimelineIR生成ASS字幕文件
   */
  static generateASS(ir: TimelineIR): string {
    const assFile = this.createASSFile(ir);
    return this.formatASSFile(assFile);
  }

  /**
   * 创建ASS文件结构
   */
  private static createASSFile(ir: TimelineIR): ASSFile {
    const assFile: ASSFile = {
      scriptInfo: this.createScriptInfo(ir),
      styles: this.createStyles(ir),
      events: this.createEvents(ir),
    };

    return assFile;
  }

  /**
   * 创建脚本信息
   */
  private static createScriptInfo(ir: TimelineIR): Record<string, string> {
    return {
      Title: "SmartCut Frontend Generated Subtitles",
      ScriptType: "v4.00+",
      WrapStyle: "0",
      ScaledBorderAndShadow: "yes",
      "YCbCr Matrix": "TV.709",
      PlayResX: ir.width.toString(),
      PlayResY: ir.height.toString(),
    };
  }

  /**
   * 创建样式定义
   */
  private static createStyles(ir: TimelineIR): ASSStyle[] {
    const styles: ASSStyle[] = [];
    const usedStyles = new Set<string>();

    // 为每个文本元素创建样式
    for (const text of ir.texts) {
      const styleKey = this.getStyleKey(text.style);
      
      if (!usedStyles.has(styleKey)) {
        usedStyles.add(styleKey);
        
        const style: ASSStyle = {
          name: `Style_${usedStyles.size}`,
          fontName: text.style.fontFamily || "Arial",
          fontSize: text.style.fontSize || 40,
          primaryColor: this.convertColorToASS(text.style.color || "#FFFFFF"),
          secondaryColor: this.convertColorToASS(text.style.color || "#FFFFFF"),
          outlineColor: "&H00000000", // 黑色描边
          backColor: this.convertColorToASS(text.style.backgroundColor || "transparent"),
          bold: text.style.fontWeight === "bold",
          italic: text.style.fontStyle === "italic",
          underline: text.style.textDecoration === "underline",
          strikeOut: text.style.textDecoration === "line-through",
          scaleX: 100,
          scaleY: 100,
          spacing: 0,
          angle: text.style.rotation || 0,
          borderStyle: 1,
          outline: 2,
          shadow: text.style.shadow ? 2 : 0,
          alignment: this.convertAlignment(text.style.align || "center"),
          marginL: 10,
          marginR: 10,
          marginV: 60, // 增加底部边距，让字幕不要太靠下
          encoding: 1,
        };

        styles.push(style);
      }
    }

    // 如果没有文本元素，创建默认样式
    if (styles.length === 0) {
      styles.push(this.createDefaultStyle());
    }

    return styles;
  }

  /**
   * 创建事件（对话）
   */
  private static createEvents(ir: TimelineIR): ASSDialogue[] {
    const events: ASSDialogue[] = [];

    for (const text of ir.texts) {
      const styleKey = this.getStyleKey(text.style);
      const styleName = `Style_${this.getStyleIndex(ir, styleKey)}`;

      const dialogue: ASSDialogue = {
        layer: 0,
        start: this.formatTime(text.start),
        end: this.formatTime(text.end),
        style: styleName,
        name: "",
        marginL: 0,
        marginR: 0,
        marginV: 0,
        effect: "",
        text: this.formatText(text.text, text.style),
      };

      events.push(dialogue);
    }

    return events;
  }

  /**
   * 格式化ASS文件
   */
  private static formatASSFile(assFile: ASSFile): string {
    let content = "";

    // Script Info 部分
    content += "[Script Info]\n";
    for (const [key, value] of Object.entries(assFile.scriptInfo)) {
      content += `${key}: ${value}\n`;
    }
    content += "\n";

    // V4+ Styles 部分
    content += "[V4+ Styles]\n";
    content += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";
    
    for (const style of assFile.styles) {
      content += `Style: ${style.name},${style.fontName},${style.fontSize},${style.primaryColor},${style.secondaryColor},${style.outlineColor},${style.backColor},${style.bold ? -1 : 0},${style.italic ? -1 : 0},${style.underline ? -1 : 0},${style.strikeOut ? -1 : 0},${style.scaleX},${style.scaleY},${style.spacing},${style.angle},${style.borderStyle},${style.outline},${style.shadow},${style.alignment},${style.marginL},${style.marginR},${style.marginV},${style.encoding}\n`;
    }
    content += "\n";

    // Events 部分
    content += "[Events]\n";
    content += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
    
    for (const event of assFile.events) {
      content += `Dialogue: ${event.layer},${event.start},${event.end},${event.style},${event.name},${event.marginL},${event.marginR},${event.marginV},${event.effect},${event.text}\n`;
    }

    return content;
  }

  /**
   * 获取样式键值（用于去重）
   */
  private static getStyleKey(style: any): string {
    return JSON.stringify({
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      color: style.color,
      backgroundColor: style.backgroundColor,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textDecoration: style.textDecoration,
      align: style.align,
    });
  }

  /**
   * 获取样式索引
   */
  private static getStyleIndex(ir: TimelineIR, styleKey: string): number {
    const usedStyles = new Set<string>();
    let index = 0;

    for (const text of ir.texts) {
      const currentStyleKey = this.getStyleKey(text.style);
      if (!usedStyles.has(currentStyleKey)) {
        usedStyles.add(currentStyleKey);
        index++;
        if (currentStyleKey === styleKey) {
          return index;
        }
      }
    }

    return 1; // 默认返回1
  }

  /**
   * 转换颜色格式为ASS格式
   */
  private static convertColorToASS(color: string): string {
    if (color === "transparent" || !color) {
      return "&H00000000";
    }

    // 处理十六进制颜色
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      if (hex.length === 6) {
        // 转换为BGR格式（ASS使用BGR而不是RGB）
        const r = hex.slice(0, 2);
        const g = hex.slice(2, 4);
        const b = hex.slice(4, 6);
        return `&H00${b}${g}${r}`.toUpperCase();
      }
    }

    // 处理RGB格式
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
      return `&H00${b}${g}${r}`.toUpperCase();
    }

    // 默认白色
    return "&H00FFFFFF";
  }

  /**
   * 转换对齐方式
   */
  private static convertAlignment(align: string): number {
    switch (align) {
      case "left":
        return 1; // 左下
      case "center":
        return 2; // 中下
      case "right":
        return 3; // 右下
      default:
        return 2; // 默认居中
    }
  }

  /**
   * 格式化时间为ASS格式 (H:MM:SS.CC)
   */
  private static formatTime(timeMs: number): string {
    const totalSeconds = timeMs / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const centiseconds = Math.floor((totalSeconds % 1) * 100);

    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  }

  /**
   * 格式化文本内容
   */
  private static formatText(text: string, style: any): string {
    let formattedText = text;

    // 处理位置 - 只有在明确指定非默认位置时才添加pos标签
    // 对于居中对齐的字幕，不需要pos标签，使用样式的alignment即可
    if (style.x !== undefined && style.y !== undefined &&
        !(style.x === 0 && style.align === 'center')) {
      formattedText = `{\\pos(${style.x},${style.y})}${formattedText}`;
    }

    // 处理透明度
    if (style.opacity !== undefined && style.opacity !== 1) {
      const alpha = Math.round((1 - style.opacity) * 255);
      const alphaHex = alpha.toString(16).padStart(2, "0").toUpperCase();
      formattedText = `{\\alpha&H${alphaHex}&}${formattedText}`;
    }

    // 处理阴影
    if (style.shadow) {
      const shadowX = style.shadow.x || 2;
      const shadowY = style.shadow.y || 2;
      const shadowBlur = style.shadow.blur || 0;
      formattedText = `{\\shad${shadowX}}${formattedText}`;
    }

    // 转义特殊字符
    formattedText = formattedText
      .replace(/\\/g, "\\\\")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\n/g, "\\N");

    return formattedText;
  }

  /**
   * 创建默认样式
   */
  private static createDefaultStyle(): ASSStyle {
    return {
      name: "Default",
      fontName: "Arial",
      fontSize: 40,
      primaryColor: "&H00FFFFFF",
      secondaryColor: "&H00FFFFFF",
      outlineColor: "&H00000000",
      backColor: "&H00000000",
      bold: false,
      italic: false,
      underline: false,
      strikeOut: false,
      scaleX: 100,
      scaleY: 100,
      spacing: 0,
      angle: 0,
      borderStyle: 1,
      outline: 2,
      shadow: 2,
      alignment: 2,
      marginL: 10,
      marginR: 10,
      marginV: 60, // 增加底部边距，让字幕不要太靠下
      encoding: 1,
    };
  }

  /**
   * 验证ASS文件格式
   */
  static validateASS(assContent: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 检查必要的部分
    if (!assContent.includes("[Script Info]")) {
      errors.push("缺少 [Script Info] 部分");
    }
    
    if (!assContent.includes("[V4+ Styles]")) {
      errors.push("缺少 [V4+ Styles] 部分");
    }
    
    if (!assContent.includes("[Events]")) {
      errors.push("缺少 [Events] 部分");
    }

    // 检查格式行
    if (!assContent.includes("Format: Layer, Start, End, Style")) {
      errors.push("Events 部分缺少正确的格式行");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
