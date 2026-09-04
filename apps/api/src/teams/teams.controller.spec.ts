import { BadRequestException } from '@nestjs/common';
import { requireRosterFiles } from './teams.controller';

function file(mimetype: string): Express.Multer.File {
  return { mimetype } as Express.Multer.File;
}

describe('requireRosterFiles', () => {
  it('accepts jpeg/png/webp files for all three fields', () => {
    const result = requireRosterFiles({
      photo: [file('image/jpeg')],
      idFile: [file('image/png')],
      secondaryIdFile: [file('image/webp')],
    });

    expect(result.photo.mimetype).toBe('image/jpeg');
    expect(result.idFile.mimetype).toBe('image/png');
    expect(result.secondaryIdFile.mimetype).toBe('image/webp');
  });

  it('rejects a disallowed mimetype even when all files are present', () => {
    expect(() =>
      requireRosterFiles({
        photo: [file('application/pdf')],
        idFile: [file('image/png')],
        secondaryIdFile: [file('image/png')],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects when any file is missing entirely', () => {
    expect(() =>
      requireRosterFiles({
        idFile: [file('image/png')],
        secondaryIdFile: [file('image/png')],
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      requireRosterFiles({
        photo: [file('image/png')],
        secondaryIdFile: [file('image/png')],
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      requireRosterFiles({
        photo: [file('image/png')],
        idFile: [file('image/png')],
      }),
    ).toThrow(BadRequestException);
  });
});
