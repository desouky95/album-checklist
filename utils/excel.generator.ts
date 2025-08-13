import {
  AddWorksheetOptions,
  Borders,
  ConditionalFormattingRule,
  Workbook,
} from "exceljs";
import { CardResult } from "./laststicker.scrapper";
// import { imageSizeFromFile } from "image-size/fromFile";
import * as fs from "fs";
type Sheets = {
  Cards?: string[][];
  Missing?: string[][];
  Duplicates?: string[][];
};
type AlbumInformation = {
  name: string;
  year: string;
  publisher: string;
};
type PageOrientation = "portrait" | "landscape";
type PageAspectRatio = 1.4142 | 0.707;
type GenerateOptions = {
  outputName: string;
  albumName: string;
  albumYear: string;
  publisher: string;
  withGrid: boolean;
};

const SOLID_BORDER_STYLE: Partial<Borders> = {
  bottom: { style: "thick", color: { argb: "000000" } },
  diagonal: { style: "thick", color: { argb: "000000" } },
  left: { style: "thick", color: { argb: "000000" } },
  right: { style: "thick", color: { argb: "000000" } },
  top: { style: "thick", color: { argb: "000000" } },
};
export class Excel<T extends CardResult = CardResult> {
  workbook!: Workbook;
  data!: T[];
  sheets!: Sheets;
  options!: GenerateOptions;

  constructor() {
    this.workbook = new Workbook();
  }

  async generate<R extends T>(_data: R[], options: GenerateOptions) {
    this.data = _data;
    this.options = options;
    this.generateMainSheet();
    const gridData = {
      data: _data,
    };

    if (options.withGrid) {
      this.generateDuplicatesGrid();
      this.generateGrid();
    }

    if (!fs.existsSync(`./output`)) {
      fs.mkdirSync(`./output`, { recursive: true });
    }

    const outputName = options.withGrid
      ? `${options.outputName}-grid`
      : options.outputName;
    const fileName = `./output/${outputName}.xlsx`;

    await this.workbook.xlsx.writeFile(fileName);
  }

  private getAutoWidths(data: any) {
    const colWidths: any = [];

    const numCols = data[0]?.length || 0;

    for (let col = 0; col < numCols; col++) {
      let maxLen = 10; // minimum width
      for (let row = 0; row < data.length; row++) {
        const val = data[row][col];
        const len = val ? val.toString().length : 0;
        if (len > maxLen) maxLen = len;
      }
      colWidths.push({ width: maxLen + 2 }); // +2 padding
    }

    return colWidths;
  }

  private calculateGridFromAspectRatio(
    itemCount: number,
    aspectRatio: PageAspectRatio
  ) {
    const rows = Math.ceil(Math.sqrt(itemCount / aspectRatio));
    const cols = Math.ceil(itemCount / rows);

    return { rows, cols };
  }
  private getBestGridLayout(
    itemCount: number,
    pageOptions = {
      portrait: { rows: 50, cols: 8 },
      landscape: { rows: 40, cols: 12 },
    }
  ) {
    const a4PortraitRatio = 0.707;
    const a4LandscapeRatio = 1.4142;

    const portrait = this.calculateGridFromAspectRatio(
      itemCount,
      a4PortraitRatio
    );
    const landscape = this.calculateGridFromAspectRatio(
      itemCount,
      a4LandscapeRatio
    );

    const areaPortrait = portrait.rows * portrait.cols;
    const areaLandscape = landscape.rows * landscape.cols;

    return areaPortrait <= areaLandscape
      ? { ...portrait, orientation: "portrait" as PageOrientation }
      : { ...landscape, orientation: "landscape" as PageOrientation };
  }

  private generateMainSheet() {
    const data = [
      ["Number", "Title", "Section", "Type", "Hold"],
      ...this.data.map((card) => [
        card.number || "",
        card.title || "",
        card.section || "",
        card.type || "",
      ]),
    ];

    this.sheets = {
      Cards: data,
    };
    for (const [sheetName, sheetData] of Object.entries(this.sheets)) {
      const worksheet = this.workbook.addWorksheet(sheetName, {
        state: "visible",
      });
      const firstColumn = worksheet.getColumn("A");
      if (firstColumn) firstColumn.alignment = { horizontal: "center" };
      worksheet.addRows(sheetData);
      worksheet.columns = this.getAutoWidths(data);
    }

    for (let i = 0; i < this.sheets.Cards?.length!; i++) {
      const worksheet = this.workbook.getWorksheet("Cards");

      const duplicateStringCell = worksheet?.getCell(i + 2, 6);
      if (duplicateStringCell) {
        duplicateStringCell.value = {
          formula: `=_xlfn.IF(E${i + 2}<2,"",_xlfn.IF(E${i + 2}<3,A${
            i + 2
          },_xlfn.CONCAT(A${i + 2},"(",E${i + 2} - 1,")")))`,
        };
      }
    }

    const sheetInfos = [
      {
        name: "Collection",
        countFormula: `=_xlfn.COUNTIF(E2:E${this.data.length + 1},">0")`,
        textFormula: `=_xlfn.TEXTJOIN(",",TRUE,_xlfn.FILTER(A2:A${
          this.data.length + 1
        },E2:E${this.data.length + 1} > 0))`,
      },
      {
        name: "Duplicates",
        countFormula: `=_xlfn.SUMIF(E2:E${
          this.data.length + 1
        },">1") - _xlfn.COUNTIF(E2:E${this.data.length + 1},">1")`,
        textFormula: `=_xlfn.TEXTJOIN(",",TRUE,F2:F${this.data.length + 1})`,
      },
      {
        name: "Unique",
        countFormula: `=_xlfn.COUNTIF(E2:E${this.data.length + 1},">1")`,
        textFormula: `=_xlfn.TEXTJOIN(",",TRUE,_xlfn.FILTER(A2:A${
          this.data.length + 1
        },E2:E${this.data.length + 1} > 1))`,
      },
      {
        name: "Missing",
        countFormula: `=_xlfn.COUNTBLANK(E2:E${this.data.length + 1})`,
        textFormula: `=_xlfn.TEXTJOIN(",",TRUE,_xlfn.FILTER(A:A,_xlfn.ISBLANK(E:E)))`,
      },
    ];
    const worksheet = this.workbook.getWorksheet("Cards");
    if (worksheet) {
      for (let [index, value] of sheetInfos.entries()) {
        const nameCell = worksheet?.getCell(index * 3 + 1, 8);
        const countCell = worksheet?.getCell(index * 3 + 2, 8);
        const textCell = worksheet?.getCell(index * 3 + 3, 8);
        nameCell.value = value.name;
        countCell.value = { formula: value.countFormula };
        textCell.value = { formula: value.textFormula };
      }
    }
  }
  private generateDuplicatesGrid() {
    const gridData = {
      data: this.data,
    };

    const { cols, orientation, rows } = this.getBestGridLayout(
      gridData.data.length
    );

    const worksheetOptions: Partial<AddWorksheetOptions> = {
      state: "visible",
      pageSetup: {
        horizontalCentered: true,
        verticalCentered: true,
        blackAndWhite: true,
        orientation: orientation,
        fitToPage: true,
        paperSize: 9, // A4
      },
      headerFooter: {
        firstHeader: `Album: ${this.options.albumName}`,
      },
      properties: {
        showGridLines: true,
      },
    };
    const worksheetWithDuplicates = this.workbook.addWorksheet(
      "DuplicatesGrid",
      worksheetOptions
    );
    const duplicatesEndColumnKey = worksheetWithDuplicates.getColumn(
      cols * 2
    ).letter;

    worksheetWithDuplicates.getRow(1).height = 20;

    worksheetWithDuplicates.mergeCellsWithoutStyle(
      `A1:${duplicatesEndColumnKey}1`
    );
    const dNameCell = worksheetWithDuplicates.getCell(`A1`);

    dNameCell.value = {
      richText: [
        { text: this.options.albumName, font: { bold: true, size: 22 } },
      ],
    };
    for (let i = 0; i < rows; i++) {
      const duplicateRow = worksheetWithDuplicates.addRow([]);

      duplicateRow.height = 20;
      for (let j = 0; j < cols; j++) {
        const index = i * cols + j;

        const dCellIndex = j * 2 + 1;
        const dCell1 = duplicateRow.getCell(dCellIndex);
        const dCell2 = duplicateRow.getCell(dCellIndex + 1);

        if (index < gridData.data.length) {
          const card = gridData.data[index];

          dCell1.value = {
            richText: [{ text: card.number }],
          };
          dCell2.value = {
            formula: `=IF(Cards!E${index + 2} - 1 < 0,0,Cards!E${
              index + 2
            } - 1)`,
          };
        }
      }
    }

    const rules: ConditionalFormattingRule[] = [
      {
        type: "cellIs",
        operator: "lessThan",
        priority: 1,
        formulae: ["1"],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: "f44336" },
          },
        },
      },
      {
        type: "cellIs",
        operator: "greaterThan",
        priority: 2,
        formulae: ["0"],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: "6aa84f" },
          },
        },
      },
    ];
    for (let i = 0; i < cols; i++) {
      const dColumn = worksheetWithDuplicates.getColumn(i * 2 + 2);
      const letter = dColumn.letter;
      const ref = `${letter}1:${letter}${dColumn.values.length - 1}`;
      worksheetWithDuplicates.addConditionalFormatting({
        ref,
        rules,
      });
    }

    worksheetWithDuplicates.eachRow((row) => {
      row.eachCell((cell) => {
        cell.style = {
          alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          },
          border: SOLID_BORDER_STYLE,
        };
      });
    });
  }

  private generateGrid() {
    const gridData = {
      data: this.data,
    };

    const { cols, orientation, rows } = this.getBestGridLayout(
      gridData.data.length
    );

    const worksheetOptions: Partial<AddWorksheetOptions> = {
      state: "visible",
      pageSetup: {
        horizontalCentered: true,
        verticalCentered: true,
        blackAndWhite: true,
        orientation: orientation,
        fitToPage: true,
        paperSize: 9, // A4
      },
      headerFooter: {
        firstHeader: `Album: ${this.options.albumName}`,
      },
      properties: {
        showGridLines: true,
      },
    };

    const worksheet = this.workbook.addWorksheet("Grid", worksheetOptions);
    const worksheetEndColumnKey = worksheet.getColumn(cols).letter;
    const duplicatesEndColumnKey = worksheet.getColumn(cols * 2).letter;
    worksheet.pageSetup.printArea = `A1:${worksheetEndColumnKey}${rows + 1}`;

    worksheet.getRow(1).height = 20;

    worksheet.mergeCellsWithoutStyle(`A1:${worksheetEndColumnKey}1`);

    const nameCell = worksheet.getCell(`A1`);
    nameCell.value = {
      richText: [
        { text: this.options.albumName, font: { bold: true, size: 22 } },
      ],
    };

    for (let i = 0; i < rows; i++) {
      const row = worksheet.addRow([]);
      row.height = 20;
      for (let j = 0; j < cols; j++) {
        const index = i * cols + j;
        const cell = row.getCell(j + 1);

        worksheet.addConditionalFormatting({
          ref: cell.$col$row,
          rules: [
            {
              type: "expression",
              priority: 1,
              formulae: [`=Cards!E${index + 2} > 0`],
              style: {
                fill: {
                  type: "pattern",
                  pattern: "solid",
                  bgColor: { argb: "6aa84f" },
                },
              },
            },
          ],
        });

        if (index < gridData.data.length) {
          const card = gridData.data[index];

          cell.value = {
            richText: [{ text: card.number }],
          };
        }
      }
    }

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.style = {
          alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          },
          border: SOLID_BORDER_STYLE,
        };
      });
    });
  }
}
