import { Scale } from 'app/shared/services/view-persistence';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ScaleConfig } from './scale-config';
import { ScaleStore } from './scale-store';

describe('ScaleStore', () => {

    const nameCol: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
    const amountCol: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
    const percentCol: Column = { name: 'Percent', dataType: DataType.NUMBER, width: 10 };

    let onChangeSpy: jasmine.Spy;
    let scaleConfigAmount: ScaleConfig;
    let scaleConfigPercent: ScaleConfig;

    let store: ScaleStore;

    beforeEach(() => {
        onChangeSpy = jasmine.createSpy('onChange');
        scaleConfigAmount = scaleConfig(amountCol.name, 10);
        scaleConfigPercent = scaleConfig(percentCol.name, 20);
        store = new ScaleStore(onChangeSpy);
    });

    it('#toScaleConfig', () => {
        // given
        const scaleIn = scale('X', 10);

        // when
        const scaleConfigs = store.toScaleConfig(scaleIn);

        // then
        expect(scaleConfigs.toScale()).toEqual({
            columnName: 'X',
            ticks: {
                stepSize: 10,
                rotation: undefined
            }
        });
    });

    it('#store', () => {
        // when
        store.store([scaleConfigAmount, scaleConfigPercent]);

        // then
        expect(store.size).toBe(2);
    });

    it('#scaleConfigs - undefined columns', () => {
        // when
        const scaleConfigs = store.scaleConfigs(undefined);

        // then
        expect(scaleConfigs).toEqual([]);
    });

    it('#scaleConfigs - non-cached scale', () => {
        // when
        const scaleConfigs = store.scaleConfigs([nameCol]);

        // then
        expect(ScaleConfig.toScales(scaleConfigs)).toEqual([{
            columnName: nameCol.name,
            ticks: {
                stepSize: undefined,
                rotation: undefined
            }
        }]);
    });

    it('#scaleConfigs - cached scales', () => {
        // given
        store.store([scaleConfigAmount, scaleConfigPercent]);

        // when
        const scaleConfigs = store.scaleConfigs([amountCol, percentCol]);

        // then
        expect(ScaleConfig.toScales(scaleConfigs)).toEqual([
            {
                columnName: amountCol.name,
                ticks: {
                    stepSize: 10,
                    rotation: undefined
                }
            },
            {
                columnName: percentCol.name,
                ticks: {
                    stepSize: 20,
                    rotation: undefined
                }
            }
        ]);
    });

    it('#scaleConfig - undefined column', () => {

        // when
        const scaleConfig = store.scaleConfig();

        // then
        expect(scaleConfig.toScale()).toEqual({
            columnName: undefined,
            ticks: {
                stepSize: undefined,
                rotation: undefined
            }
        });
    });

    it('#set', () => {
        // given
        const scaleIn = scale(nameCol.name, 10);

        // when
        store.set(scaleIn);

        // then
        const scaelConfig = store.scaleConfig(nameCol);
        expect(scaelConfig).toBeDefined();
        expect(scaelConfig.toScale()).toEqual({
            columnName: nameCol.name,
            ticks: {
                stepSize: 10,
                rotation: undefined
            }
        });
    });

    function scaleConfig(columnName: string, stepSize?: number): ScaleConfig {
        return new ScaleConfig(onChangeSpy, scale(columnName, stepSize));
    }

    function scale(columnName: string, stepSize?: number): Scale {
        return {
            columnName,
            ticks: {
                stepSize
            }
        };
    }

});