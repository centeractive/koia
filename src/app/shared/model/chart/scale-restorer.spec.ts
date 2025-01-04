import { Scale } from 'app/shared/services/view-persistence';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ScaleConfig } from './scale-config';
import { ScaleRestorer } from './scale-restorer';

describe('ScaleRestorer', () => {

    const nameCol: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
    const amountCol: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
    const percentCol: Column = { name: 'Percent', dataType: DataType.NUMBER, width: 10 };

    let onChangeSpy: jasmine.Spy;
    let scaleConfigAmount: ScaleConfig;
    let scaleConfigPercent: ScaleConfig;

    let restorer: ScaleRestorer;

    beforeEach(() => {
        onChangeSpy = jasmine.createSpy('onChange');
        scaleConfigAmount = scaleConfig(amountCol.name, 10);
        scaleConfigPercent = scaleConfig(percentCol.name, 20);
        restorer = new ScaleRestorer(onChangeSpy);
    });

    it('#toScaleConfig - undefined scale', () => {
        // when
        const scaleConfigs = restorer.toScaleConfig(undefined);

        // then
        expect(scaleConfigs.toScale()).toEqual({
            columnName: undefined,
            ticks: {
                stepSize: undefined,
                rotation: undefined
            }
        });
    });

    it('#toScaleConfig', () => {
        // given
        const scaleIn = scale('X', 10);

        // when
        const scaleConfigs = restorer.toScaleConfig(scaleIn);

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
        restorer.store([scaleConfigAmount, scaleConfigPercent]);

        // then
        expect(restorer.size).toBe(2);
    });

    it('#scaleConfigs - undefined columns', () => {
        // when
        const scaleConfigs = restorer.scaleConfigs(undefined);

        // then
        expect(scaleConfigs).toEqual([]);
    });

    it('#scaleConfigs - non-cached scale', () => {
        // when
        const scaleConfigs = restorer.scaleConfigs([nameCol]);

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
        restorer.store([scaleConfigAmount, scaleConfigPercent]);

        // when
        const scaleConfigs = restorer.scaleConfigs([amountCol, percentCol]);

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
        const scaleConfig = restorer.scaleConfig();

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
        restorer.set(scaleIn);

        // then
        const scaelConfig = restorer.scaleConfig(nameCol);
        expect(scaelConfig).toBeDefined();
        expect(scaelConfig.toScale()).toEqual({
            columnName: nameCol.name,
            ticks: {
                stepSize: 10,
                rotation: undefined
            }
        });
    });

    it('#set - undefined column name', () => {
        // given
        const scaleIn = scale(undefined, 10);

        // when
        restorer.set(scaleIn);

        // then
        expect(restorer.size).toBe(0);
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