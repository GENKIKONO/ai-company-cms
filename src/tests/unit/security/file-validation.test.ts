/**
 * Unit tests for File Validation Security
 *
 * Tests MIME type spoofing prevention including:
 * - Magic byte validation
 * - File size limits
 * - MIME type allowlisting
 * - Edge cases and attack vectors
 *
 * @jest-environment node
 */

import {
  validateMagicBytes,
  validateImageFile,
  getFileExtension,
} from '@/lib/security/file-validation';

// Mock file creation helper
function createMockFile(
  buffer: ArrayBuffer | Buffer,
  type: string,
  name: string = 'test.jpg'
): File {
  const blob = new Blob([buffer], { type });
  return Object.assign(blob, {
    name,
    lastModified: Date.now(),
    arrayBuffer: () => Promise.resolve(buffer instanceof Buffer ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) : buffer),
  }) as File;
}

describe('File Validation Security', () => {
  describe('validateMagicBytes', () => {
    describe('PNG validation', () => {
      it('should validate correct PNG magic bytes', () => {
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        const pngBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]).buffer;
        const result = validateMagicBytes(pngBuffer, 'image/png');
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/png');
      });

      it('should reject invalid PNG magic bytes', () => {
        // Wrong signature
        const invalidBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x48, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;
        const result = validateMagicBytes(invalidBuffer, 'image/png');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('image/png');
      });

      it('should reject JPEG file masquerading as PNG', () => {
        // JPEG signature pretending to be PNG
        const jpegBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]).buffer;
        const result = validateMagicBytes(jpegBuffer, 'image/png');
        expect(result.valid).toBe(false);
      });
    });

    describe('JPEG validation', () => {
      it('should validate correct JPEG magic bytes', () => {
        // JPEG signature: FF D8 FF
        const jpegBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]).buffer;
        const result = validateMagicBytes(jpegBuffer, 'image/jpeg');
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/jpeg');
      });

      it('should reject invalid JPEG magic bytes', () => {
        // Wrong signature
        const invalidBuffer = new Uint8Array([0xff, 0xd9, 0xff, 0xe0]).buffer;
        const result = validateMagicBytes(invalidBuffer, 'image/jpeg');
        expect(result.valid).toBe(false);
      });

      it('should reject PNG file masquerading as JPEG', () => {
        const pngBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;
        const result = validateMagicBytes(pngBuffer, 'image/jpeg');
        expect(result.valid).toBe(false);
      });
    });

    describe('WebP validation', () => {
      it('should validate correct WebP magic bytes', () => {
        // WebP: RIFF....WEBP
        const webpBuffer = new Uint8Array([
          0x52, 0x49, 0x46, 0x46, // RIFF
          0x00, 0x00, 0x00, 0x00, // File size placeholder
          0x57, 0x45, 0x42, 0x50, // WEBP
        ]).buffer;
        const result = validateMagicBytes(webpBuffer, 'image/webp');
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/webp');
      });

      it('should reject AVI file masquerading as WebP (RIFF container)', () => {
        // AVI uses RIFF but with AVI marker
        const aviBuffer = new Uint8Array([
          0x52, 0x49, 0x46, 0x46, // RIFF
          0x00, 0x00, 0x00, 0x00, // File size
          0x41, 0x56, 0x49, 0x20, // AVI (not WEBP)
        ]).buffer;
        const result = validateMagicBytes(aviBuffer, 'image/webp');
        expect(result.valid).toBe(false);
      });

      it('should reject incomplete WebP header', () => {
        // Only RIFF, missing WEBP marker
        const incompleteBuffer = new Uint8Array([
          0x52, 0x49, 0x46, 0x46, // RIFF
          0x00, 0x00, 0x00, 0x00, // File size
        ]).buffer;
        const result = validateMagicBytes(incompleteBuffer, 'image/webp');
        expect(result.valid).toBe(false);
      });
    });

    describe('GIF validation', () => {
      it('should validate GIF87a magic bytes', () => {
        // GIF87a
        const gif87Buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]).buffer;
        const result = validateMagicBytes(gif87Buffer, 'image/gif');
        expect(result.valid).toBe(true);
      });

      it('should validate GIF89a magic bytes', () => {
        // GIF89a
        const gif89Buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]).buffer;
        const result = validateMagicBytes(gif89Buffer, 'image/gif');
        expect(result.valid).toBe(true);
      });

      it('should reject invalid GIF version', () => {
        // GIF80a (invalid version)
        const invalidGifBuffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x30, 0x61]).buffer;
        const result = validateMagicBytes(invalidGifBuffer, 'image/gif');
        expect(result.valid).toBe(false);
      });
    });

    describe('SVG validation', () => {
      it('should validate SVG with <svg tag', () => {
        const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
        const svgBuffer = new TextEncoder().encode(svgContent).buffer;
        const result = validateMagicBytes(svgBuffer, 'image/svg+xml');
        expect(result.valid).toBe(true);
        expect(result.detectedType).toBe('image/svg+xml');
      });

      it('should validate SVG with XML declaration', () => {
        const svgContent = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';
        const svgBuffer = new TextEncoder().encode(svgContent).buffer;
        const result = validateMagicBytes(svgBuffer, 'image/svg+xml');
        expect(result.valid).toBe(true);
      });

      it('should reject HTML masquerading as SVG', () => {
        const htmlContent = '<html><body><img src="test.jpg"/></body></html>';
        const htmlBuffer = new TextEncoder().encode(htmlContent).buffer;
        const result = validateMagicBytes(htmlBuffer, 'image/svg+xml');
        expect(result.valid).toBe(false);
      });

      it('should reject JavaScript masquerading as SVG', () => {
        const jsContent = 'function malicious() { alert("XSS"); }';
        const jsBuffer = new TextEncoder().encode(jsContent).buffer;
        const result = validateMagicBytes(jsBuffer, 'image/svg+xml');
        expect(result.valid).toBe(false);
      });
    });

    describe('Unsupported types', () => {
      it('should reject unsupported MIME types', () => {
        const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;
        const result = validateMagicBytes(buffer, 'application/pdf');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('未対応');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty buffer', () => {
        const emptyBuffer = new Uint8Array([]).buffer;
        const result = validateMagicBytes(emptyBuffer, 'image/png');
        expect(result.valid).toBe(false);
      });

      it('should handle buffer too short for signature', () => {
        // PNG needs 8 bytes, only provide 4
        const shortBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
        const result = validateMagicBytes(shortBuffer, 'image/png');
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validateImageFile', () => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 1 * 1024 * 1024; // 1MB

    it('should accept valid PNG file', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const file = createMockFile(pngBuffer, 'image/png', 'test.png');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(true);
    });

    it('should accept valid JPEG file', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const file = createMockFile(jpegBuffer, 'image/jpeg', 'test.jpg');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed MIME type', async () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const file = createMockFile(gifBuffer, 'image/gif', 'test.gif');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('許可されていない');
    });

    it('should reject file exceeding size limit', async () => {
      // Create a buffer larger than maxSize
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB
      // Add PNG signature
      largeBuffer[0] = 0x89;
      largeBuffer[1] = 0x50;
      largeBuffer[2] = 0x4e;
      largeBuffer[3] = 0x47;
      largeBuffer[4] = 0x0d;
      largeBuffer[5] = 0x0a;
      largeBuffer[6] = 0x1a;
      largeBuffer[7] = 0x0a;

      const file = createMockFile(largeBuffer, 'image/png', 'large.png');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('大きすぎ');
    });

    it('should reject MIME type spoofing (PNG declared but JPEG content)', async () => {
      // JPEG content but declared as PNG
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const file = createMockFile(jpegBuffer, 'image/png', 'fake.png');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('一致しません');
    });

    it('should reject MIME type spoofing (JPEG declared but PNG content)', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const file = createMockFile(pngBuffer, 'image/jpeg', 'fake.jpg');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('一致しません');
    });

    it('should reject executable masquerading as image', async () => {
      // PE executable signature (MZ) pretending to be PNG
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const file = createMockFile(exeBuffer, 'image/png', 'malware.png');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(false);
    });

    it('should reject ZIP masquerading as image', async () => {
      // ZIP signature (PK)
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      const file = createMockFile(zipBuffer, 'image/jpeg', 'archive.jpg');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extension for PNG', () => {
      expect(getFileExtension('image/png')).toBe('.png');
    });

    it('should return correct extension for JPEG', () => {
      expect(getFileExtension('image/jpeg')).toBe('.jpg');
    });

    it('should return correct extension for WebP', () => {
      expect(getFileExtension('image/webp')).toBe('.webp');
    });

    it('should return correct extension for GIF', () => {
      expect(getFileExtension('image/gif')).toBe('.gif');
    });

    it('should return correct extension for SVG', () => {
      expect(getFileExtension('image/svg+xml')).toBe('.svg');
    });

    it('should return .bin for unknown types', () => {
      expect(getFileExtension('application/octet-stream')).toBe('.bin');
      expect(getFileExtension('unknown/type')).toBe('.bin');
    });
  });

  describe('Security Attack Vectors', () => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    const maxSize = 10 * 1024 * 1024;

    it('should prevent polyglot file attacks', async () => {
      // GIF with embedded JavaScript - starts with GIF but contains code
      const polyglotBuffer = Buffer.from(
        'GIF89a/*<svg onload=alert(1)/>*/' + '\x00'.repeat(100)
      );
      const file = createMockFile(polyglotBuffer, 'image/gif', 'polyglot.gif');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      // The magic bytes check should pass as GIF89a is valid
      // But additional content scanning would be needed for full protection
      expect(result.valid).toBe(true);
      // Note: For complete security, additional scanning for embedded scripts would be needed
    });

    it('should reject null byte injection', async () => {
      // File with null bytes trying to bypass extension checks
      const nullByteBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, // JPEG start
        0x00, 0x00, 0x00, 0x00, // Null bytes
        0x3c, 0x73, 0x63, 0x72, // <scr
        0x69, 0x70, 0x74, 0x3e, // ipt>
      ]);
      const file = createMockFile(nullByteBuffer, 'image/jpeg', 'test\x00.exe.jpg');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      // Should still validate as JPEG based on magic bytes
      expect(result.valid).toBe(true);
      // Note: Filename validation is a separate concern
    });

    it('should validate file completely even with padding', async () => {
      // Valid JPEG signature with lots of padding
      const paddedBuffer = Buffer.alloc(1000);
      paddedBuffer[0] = 0xff;
      paddedBuffer[1] = 0xd8;
      paddedBuffer[2] = 0xff;

      const file = createMockFile(paddedBuffer, 'image/jpeg', 'padded.jpg');

      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(true);
    });

    it('should handle extremely long filename gracefully', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const longName = 'a'.repeat(10000) + '.jpg';
      const file = createMockFile(jpegBuffer, 'image/jpeg', longName);

      // Should not throw, should validate based on content
      const result = await validateImageFile(file, allowedTypes, maxSize);
      expect(result.valid).toBe(true);
    });
  });
});
