import { SceneInfo } from 'app/shared/model';
import { SceneEdit } from './scene-edit';

describe('SceneEdit', () => {

  const existingSceneNames = new Set(['Scene 1', 'Scene 2']);

  function editOf(name = 'Scene 1', shortDescription = 'Desc 1'): SceneEdit {
    return new SceneEdit({ _id: '1', name, shortDescription } as SceneInfo, existingSceneNames);
  }

  it('should start with name and short description of scene', () => {

    // when
    const edit = editOf();

    // then
    expect(edit.name).toBe('Scene 1');
    expect(edit.shortDescription).toBe('Desc 1');
  });

  it('#isNameTaken should return false when name is unchanged', () => {

    // when
    const taken = editOf().isNameTaken();

    // then
    expect(taken).toBe(false);
  });

  it('#isNameTaken should return true when changed name exists', () => {

    // given
    const edit = editOf();
    edit.name = ' Scene 2 ';

    // when
    const taken = edit.isNameTaken();

    // then
    expect(taken).toBe(true);
  });

  it('#isNameTaken should return false when changed name is free', () => {

    // given
    const edit = editOf();
    edit.name = 'Scene 3';

    // when
    const taken = edit.isNameTaken();

    // then
    expect(taken).toBe(false);
  });

  it('#isNameTaken should return false when stored name with surrounding blanks is unchanged', () => {

    // given
    const edit = editOf('Scene 2 ');

    // when
    const taken = edit.isNameTaken();

    // then
    expect(taken).toBe(false);
  });

  it('#isNameTooLong should return false when long name is unchanged', () => {

    // given
    const edit = editOf('x'.repeat(41));

    // when
    const tooLong = edit.isNameTooLong();

    // then
    expect(tooLong).toBe(false);
  });

  it('#isNameTooLong should return true when changed name exceeds max length', () => {

    // given
    const edit = editOf();
    edit.name = 'y'.repeat(41);

    // when
    const tooLong = edit.isNameTooLong();

    // then
    expect(tooLong).toBe(true);
  });

  it('#isNameTooLong should return false when changed name has max length', () => {

    // given
    const edit = editOf();
    edit.name = 'y'.repeat(40);

    // when
    const tooLong = edit.isNameTooLong();

    // then
    expect(tooLong).toBe(false);
  });

  it('#isSavable should return false when nothing changed', () => {

    // when
    const savable = editOf().isSavable();

    // then
    expect(savable).toBe(false);
  });

  it('#isSavable should return false when stored name has surrounding blanks and nothing changed', () => {

    // when
    const savable = editOf('Scene 1 ').isSavable();

    // then
    expect(savable).toBe(false);
  });

  it('#isSavable should return true when only short description changed', () => {

    // given
    const edit = editOf();
    edit.shortDescription = 'Desc 2';

    // when
    const savable = edit.isSavable();

    // then
    expect(savable).toBe(true);
  });

  it('#isSavable should return true when name changed to free name', () => {

    // given
    const edit = editOf();
    edit.name = 'Scene 3';

    // when
    const savable = edit.isSavable();

    // then
    expect(savable).toBe(true);
  });

  it('#isSavable should return false when name is blank', () => {

    // given
    const edit = editOf();
    edit.name = ' ';

    // when
    const savable = edit.isSavable();

    // then
    expect(savable).toBe(false);
  });

  it('#isSavable should return false when short description is blank', () => {

    // given
    const edit = editOf();
    edit.name = 'Scene 3';
    edit.shortDescription = ' ';

    // when
    const savable = edit.isSavable();

    // then
    expect(savable).toBe(false);
  });

  it('#isSavable should return false when name is taken', () => {

    // given
    const edit = editOf();
    edit.name = 'Scene 2';

    // when
    const savable = edit.isSavable();

    // then
    expect(savable).toBe(false);
  });

  it('#isSavable should return false when name is too long', () => {

    // given
    const edit = editOf();
    edit.name = 'y'.repeat(41);

    // when
    const savable = edit.isSavable();

    // then
    expect(savable).toBe(false);
  });

  it('#toLabels should return id with trimmed name and short description', () => {

    // given
    const edit = editOf();
    edit.name = ' Scene 3 ';
    edit.shortDescription = ' Desc 3 ';

    // when
    const labels = edit.toLabels();

    // then
    expect(labels).toEqual({ _id: '1', name: 'Scene 3', shortDescription: 'Desc 3' });
  });

  it('#toLabels should keep stored name when only short description changed', () => {

    // given
    const edit = editOf('Scene 1 ');
    edit.shortDescription = 'Desc 3';

    // when
    const labels = edit.toLabels();

    // then
    expect(labels).toEqual({ _id: '1', name: 'Scene 1 ', shortDescription: 'Desc 3' });
  });
});
