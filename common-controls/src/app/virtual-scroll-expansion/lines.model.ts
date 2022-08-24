export interface ILines {
    EntityDiscriminator: string,
    Name: string,
    Description: string,
    DisplayOrder: number,
    ParentVisitItemId: string,
    ConditionalVisibilityValueRange: any,
    IsMandatory: boolean,
    Visibility: string,
    IsReadOnly: boolean,
    ExpectedValueRange: any,
    ValueType: any,
    NotCompliant: boolean,
    CustomValueType: any,
    Number: any,
    Room: any,
    RoomType: any,
    Equipment: any,
    ExpectedValueRangeDescription: any,
    ConditionalVisibilityValueRangeDescription: any,
    Result: any,
    PreviousValue: any,
    PreviousPhotoValue: any,
    DescriptionAttachmentsCount: number,
    HasComments: boolean,
    DescriptionAttachments: any[],
    Id: string;

    // For UI
    Level?: number;
    ItemNumber: number;
    IsExpanded: boolean;
}