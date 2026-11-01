import { NewScenesService } from './new-scenes.service';

describe('NewScenesService', () => {

  let service: NewScenesService;

  beforeEach(() => {
    service = new NewScenesService();
  });

  it('#take should return added scene IDs', () => {

    // given
    service.add('1');
    service.add('2');

    // when
    const sceneIds = service.take();

    // then
    expect(sceneIds).toEqual(new Set(['1', '2']));
  });

  it('#take should return no IDs when called again', () => {

    // given
    service.add('1');
    service.take();

    // when
    const sceneIds = service.take();

    // then
    expect(sceneIds.size).toBe(0);
  });

  it('#take should return no IDs when none was added', () => {

    // when
    const sceneIds = service.take();

    // then
    expect(sceneIds.size).toBe(0);
  });
});
