import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

//Broadly speaking, there are 5 Retail Industry Areas covering a total of 18 Industry Sectors.
/*
Specialty Retailing: Floristry; Newsagents, Stationery & Bookshops; Community Pharmacy; Specialty Stores; Jewellery; Fashion, Clothing & Footwear
Food & Beverage: Supermarkets; Liquor; Fruit & Vegetable; Fast Food & Take-away; Specialty Food
Work, Home & Lifestyle: Entertainment, Communication & Technology; Sport, Recreation & Leisure; Home Living; Hardware, Trade & Gardening
General Retailing: Department Stores; Discount & Variety
Wholesale & Logistics: Wholesale & Logistics
https://hub.com.sg/hub-guides/how-to-start-a-retail-business-in-singapore/
*/

export enum BusinessCategories {
    SPECIALITYRETAIL = 'specialityretail',
    FOODnBEVERAGE = 'foodnbeverage',
    WORKnHOMEnLIFESTYLE = 'workhomelifestyle',
    GENERALRETAIL = 'generalretail',
    WHOLESALEnLOGISTICS = 'wholesalenlogistics'
}


@Entity('business_register_business')
export class Business_register_business extends BaseEntity {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column({
        unique: true
    })
    entityName: string;

    @Column()
    location: string;

    @Column({
        type: 'enum',
        enum: BusinessCategories,
    })
    category: string;
}