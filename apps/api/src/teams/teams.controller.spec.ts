import { BadRequestException } from '@nestjs/common';
import { requireRosterFiles } from './teams.controller';

function file(mimetype: string): Express.Multer.File {
  return { mimetype } as Express.Multer.File;
}

describe('requireRosterFiles', () => {
  it('accepts jpeg/png/webp files for both fields', () => {
    const result = requireRosterFiles({
      photo: [file('image/jpeg')],
      idFile: [file('image/png')],
    });

    expect(result.photo.mimetype).toBe('image/jpeg');
    expect(result.idFile.mimetype).toBe('image/png');
  });

  it('rejects a disallowed mimetype even when both files are present', () => {
    expect(() =>
      requireRosterFiles({
        photo: [file('application/pdf')],
        idFile: [file('image/png')],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects when either file is missing entirely', () => {
    expect(() => requireRosterFiles({ idFile: [file('image/png')] })).toThrow(
      BadRequestException,
    );
    expect(() => requireRosterFiles({ photo: [file('image/png')] })).toThrow(
      BadRequestException,
    );
  });
});
